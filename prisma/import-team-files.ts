/**
 * 팀 게시판 첨부파일(이미지 + 문서)을 라이브 서버에서 다운로드해 Vercel Blob에 올리고
 * File 레코드로 연결한다. 첨부는 wiz_bbs 의 upfile1..12 컬럼에 저장돼 있고,
 * 실제 파일은 http://namsanwon.or.kr/admin/data/bbs/<code>/<stored> 에 있다.
 *
 * - 이미지는 확장자와 무관하게 매직바이트로 판별해 1600px/WebP q78로 재인코딩.
 * - 비이미지(pdf/hwp/…)는 원본 그대로 업로드.
 * - 서버에 없는 파일(404 등)은 스킵. 파일명(base) 기준 중복은 건너뜀 → 재실행 안전.
 *
 * 실행: npx tsx prisma/import-team-files.ts [code] [limit]
 *   code 지정 시 해당 게시판만, 미지정 시 전체 팀 코드.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put } from '../lib/storage';
import { optimizeImage, IMAGE_MAX_WIDTH } from '../lib/image-optimize';

const prisma = new PrismaClient();

const DUMP = path.join(__dirname, '../docs/sql/260513_namsan.sql');
const BASE = 'http://namsanwon.or.kr/admin/data/bbs';
const MAX_WIDTH = Number(process.env.IMAGE_MAX_WIDTH) || IMAGE_MAX_WIDTH;
const QUALITY = Number(process.env.IMAGE_QUALITY) || undefined;
const CONCURRENCY = 5;

// teamfiles/ 접두사로 저장되는 모든 게시판. com6(남산원 역사사진)은 팀 게시판은 아니지만
// 첨부 저장 방식이 같고 같은 접두사를 쓰므로 반드시 포함해야 한다 —
// 빠지면 prefix 단위로 초기화 후 재임포트할 때 조용히 누락된다.
const ALL_TEAM_CODES = ['bus1','bus2','bus3','bus7','cus1','cus2','cus11','cus21','dus1','dus2','eus1','schedule','com6'];
const COL = { idx: 0, code: 1 };
const UPFILE_START = 26; // upfile1..12 → 26..37
const UPNAME_START = 38; // upfile1_name..12_name → 38..49

function parseTuple(text: string, startIdx: number): { values: string[]; endIdx: number } | null {
  let i = startIdx;
  while (i < text.length && text[i] !== '(') i++;
  if (i >= text.length) return null;
  i++;
  const values: string[] = [];
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i >= text.length) break;
    if (text[i] === ')') return { values, endIdx: i + 1 };
    if (text[i] === "'") {
      i++;
      let val = '';
      while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
          const n = text[i + 1];
          val += n === 'n' ? '\n' : n === 'r' ? '\r' : n === 't' ? '\t' : n;
          i += 2;
        } else if (text[i] === "'" && text[i + 1] === "'") { val += "'"; i += 2; }
        else if (text[i] === "'") { i++; break; }
        else { val += text[i]; i++; }
      }
      values.push(val);
    } else {
      let val = '';
      while (i < text.length && text[i] !== ',' && text[i] !== ')') { val += text[i]; i++; }
      const t = val.trim();
      values.push(t.toUpperCase() === 'NULL' ? '' : t);
    }
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i < text.length && text[i] === ',') i++;
  }
  return values.length > 0 ? { values, endIdx: i } : null;
}

type Attach = { stored: string; display: string };
type PostFiles = { idx: number; code: string; files: Attach[] };

function baseName(name: string): string {
  return name.replace(/^.*[\\/]/, '');
}
function baseNoExt(name: string): string {
  return baseName(name).replace(/\.[^.]+$/, '');
}

function parseDump(sql: string, codes: Set<string>): PostFiles[] {
  const out: PostFiles[] = [];
  const re = /VALUES\s*(?=\()/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    let pos = m.index + m[0].length;
    while (true) {
      const r = parseTuple(sql, pos);
      if (!r) break;
      const v = r.values;
      pos = r.endIdx;
      if (v.length >= 59) {
        const code = v[COL.code] || '';
        const idx = parseInt(v[COL.idx]);
        if (codes.has(code) && idx > 0) {
          const files: Attach[] = [];
          for (let k = 0; k < 12; k++) {
            const stored = v[UPFILE_START + k];
            if (stored) {
              const disp = v[UPNAME_START + k] || stored;
              files.push({ stored, display: baseName(disp) });
            }
          }
          if (files.length) out.push({ idx, code, files });
        }
      }
      while (pos < sql.length && /\s/.test(sql[pos])) pos++;
      if (sql[pos] === ',') { pos++; continue; }
      break;
    }
  }
  return out;
}

function contentTypeFor(ext: string): string {
  const e = ext.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    bmp: 'image/bmp', webp: 'image/webp',
    pdf: 'application/pdf', hwp: 'application/x-hwp', hwpx: 'application/x-hwp',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip', txt: 'text/plain',
  };
  return map[e] || 'application/octet-stream';
}
type Stats = { uploaded: number; missing: number; error: number };

async function handlePost(p: PostFiles, existingBases: Set<string>, stats: Stats) {
  for (const f of p.files) {
    if (existingBases.has(baseNoExt(f.display))) continue;
    const url = `${BASE}/${p.code}/${encodeURI(f.stored)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) { stats.missing++; continue; }
      const buffer = Buffer.from(new Uint8Array(await res.arrayBuffer()));
      if (buffer.length === 0) { stats.missing++; continue; }

      const ext = path.extname(f.display).slice(1) || path.extname(f.stored).slice(1);
      const { data, contentType, filename: outName } = await optimizeImage(buffer, f.display, {
        maxWidth: MAX_WIDTH,
        quality: QUALITY,
        fallbackContentType: contentTypeFor(ext),
      });
      const safe = outName.replace(/\s+/g, '_');
      const key = `teamfiles/${p.code}/${p.idx}-${safe}`;
      const blob = await put(key, data, { contentType });
      await prisma.file.create({ data: { postId: p.idx, url: blob.url, filename: outName } });
      existingBases.add(baseNoExt(f.display));
      stats.uploaded++;
    } catch (e) {
      stats.error++;
      console.error(`  ❌ [${p.idx}] ${f.stored}:`, e instanceof Error ? e.message : e);
    }
  }
}

async function main() {
  for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[k]) { console.error(`❌ ${k} 환경변수가 없습니다.`); process.exit(1); }
  }
  const onlyCode = process.argv[2];
  const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;
  const codes = new Set(onlyCode ? [onlyCode] : ALL_TEAM_CODES);

  console.log(`🔄 팀 첨부 크롤링 (${[...codes].join(',')})...`);
  const sql = fs.readFileSync(DUMP, 'utf-8');
  let posts = parseDump(sql, codes);
  if (limit) posts = posts.slice(0, limit);
  console.log(`첨부 보유 게시물: ${posts.length}개\n`);

  // 대상 게시물들의 기존 File(base) 로드
  const ids = posts.map((p) => p.idx);
  const existing = new Map<number, Set<string>>();
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    const frows = await prisma.file.findMany({ where: { postId: { in: chunk } }, select: { postId: true, filename: true } });
    for (const fr of frows) {
      if (!existing.has(fr.postId)) existing.set(fr.postId, new Set());
      existing.get(fr.postId)!.add(baseNoExt(fr.filename));
    }
  }

  const stats: Stats = { uploaded: 0, missing: 0, error: 0 };
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((p) => handlePost(p, existing.get(p.idx) ?? new Set(), stats)));
    const done = Math.min(i + CONCURRENCY, posts.length);
    if (done % 100 === 0 || done === posts.length) {
      console.log(`진행: ${done}/${posts.length} | 업로드 ${stats.uploaded}, 서버없음 ${stats.missing}, 에러 ${stats.error}`);
    }
  }

  console.log(`\n✨ 완료! 업로드 ${stats.uploaded}, 서버없음 ${stats.missing}, 에러 ${stats.error}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
