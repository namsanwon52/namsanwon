/**
 * 구 사이트(namsanwon.or.kr)에서 덤프(2026-05-13) 이후 올라온 글을 이관한다.
 *
 * 입력 JSON은 로그인된 브라우저에서 각 게시판 상세 화면을 파싱해 만든 배열이다.
 *   { idx, code, title, name, email, date:'YY.MM.DD', views, content, files:[{no,name}], stored:[이미지 저장명] }
 *
 * - id: 구 사이트 idx를 그대로 쓰되, 신규 사이트에서 쓴 글과 번호가 겹치면 새 번호를 받는다.
 *   (명시 id를 먼저 모두 넣고 시퀀스를 최대값으로 올린 뒤, 겹친 글을 자동 번호로 넣는다)
 * - 같은 게시판에 제목과 본문 글자가 같은 2026년 글이 이미 있으면 중복으로 보고 건너뛴다.
 *   ("직원 합격 공지"처럼 제목이 반복되는 공지가 있어 제목만으로는 판단하지 않는다)
 * - 작성 시각: 첨부 저장명(YYMMDDhhmmss…)이 작성일과 같은 날이면 그 시각, 아니면 작성일 00:00(KST).
 * - 첨부: /admin/bbs/down.php 에서 받아 이미지면 WebP로 줄이고 Cloudinary에 올린 뒤 File로 연결.
 * - 기본은 dry-run. 실제 반영은 --apply.
 *
 * 실행: npx tsx prisma/import-live-crawl.ts <crawl.json> [--apply]
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put } from '../lib/storage';
import { optimizeImage, IMAGE_MAX_WIDTH } from '../lib/image-optimize';

const prisma = new PrismaClient();
const BASE = 'http://namsanwon.or.kr';
const TEAM_CODES = new Set(['bus1', 'eus1', 'dus1']); // 팀 게시판: isAdmin=true, teamfiles/ 경로
const CONCURRENCY = 4;

type Crawled = {
  idx: number; code: string; title: string; name: string; email: string; date: string; views: number;
  content: string; files: { no: number; name: string }[]; stored: string[]; err?: string;
};

const isImg = (n: string) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(n);
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const textOf = (html: string) => norm(html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')).slice(0, 300);

function createdAtOf(r: Crawled): Date {
  const [yy, mm, dd] = r.date.split('.').map(Number);
  const day = `${2000 + yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const m = r.stored[0]?.match(/^M?(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (m && `20${m[1]}-${m[2]}-${m[3]}` === day) {
    return new Date(`${day}T${m[4]}:${m[5]}:${m[6]}+09:00`);
  }
  return new Date(`${day}T00:00:00+09:00`);
}

function contentTypeFor(name: string): string {
  const e = path.extname(name).slice(1).toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
    pdf: 'application/pdf', hwp: 'application/x-hwp', hwpx: 'application/x-hwp',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip', txt: 'text/plain',
  };
  return map[e] || 'application/octet-stream';
}

async function attachFiles(r: Crawled, postId: number, stats: { uploaded: number; error: number }) {
  // 이미지 첨부는 viewImg 저장명과 같은 순서 → 갤러리형 게시판은 기존처럼 저장명을 파일명으로 쓴다
  const imgStored = [...r.stored];
  for (const f of r.files) {
    const storedName = isImg(f.name) ? imgStored.shift() : undefined;
    try {
      const res = await fetch(`${BASE}/admin/bbs/down.php?code=${r.code}&idx=${r.idx}&no=${f.no}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`download ${res.status}`);
      const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()));
      if (!buf.length) throw new Error('empty');
      const srcName = !TEAM_CODES.has(r.code) && storedName ? storedName : f.name;
      const { data, contentType, filename } = await optimizeImage(buf, srcName, {
        maxWidth: IMAGE_MAX_WIDTH,
        fallbackContentType: contentTypeFor(f.name),
      });
      const prefix = TEAM_CODES.has(r.code) ? 'teamfiles' : 'gallery';
      const blob = await put(`${prefix}/${r.code}/${postId}-${filename.replace(/\s+/g, '_')}`, data, { contentType });
      await prisma.file.create({ data: { postId, url: blob.url, filename } });
      stats.uploaded++;
    } catch (e) {
      stats.error++;
      console.error(`  ❌ #${r.idx} ${f.name}:`, e instanceof Error ? e.message : e);
    }
  }
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith('--')) {
    console.error('사용법: npx tsx prisma/import-live-crawl.ts <crawl.json> [--apply]');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const rows: Crawled[] = JSON.parse(fs.readFileSync(file, 'utf8')).filter((r: Crawled) => !r.err);

  const codes = [...new Set(rows.map((r) => r.code))];
  const existing = await prisma.post.findMany({
    where: { OR: [{ id: { in: rows.map((r) => r.idx) } }, { code: { in: codes }, createdAt: { gte: new Date('2026-01-01') } }] },
    select: { id: true, code: true, title: true, content: true },
  });
  const byId = new Map(existing.map((p) => [p.id, p]));
  const sameKey = (code: string, title: string, html: string) => `${code}|${norm(title)}|${textOf(html)}`;
  const titles = new Set(existing.map((p) => sameKey(p.code, p.title, p.content)));

  const skipped: Crawled[] = [];
  const keepId: Crawled[] = [];
  const newId: Crawled[] = [];
  for (const r of rows) {
    const same = byId.get(r.idx);
    if ((same && same.code === r.code) || titles.has(sameKey(r.code, r.title, r.content))) { skipped.push(r); continue; }
    (same ? newId : keepId).push(r);
  }

  const per: Record<string, number> = {};
  for (const r of [...keepId, ...newId]) per[r.code] = (per[r.code] || 0) + 1;
  console.log(`입력 ${rows.length}건 → 신규 ${keepId.length + newId.length}건 (원래 번호 ${keepId.length}, 새 번호 ${newId.length}), 중복 건너뜀 ${skipped.length}건`);
  console.log('게시판별:', per);
  console.log('첨부:', [...keepId, ...newId].reduce((a, r) => a + r.files.length, 0), '개');
  for (const r of newId) console.log(`  새 번호로: #${r.idx} ${r.code} ${r.title}`);
  for (const r of skipped) console.log(`  중복: #${r.idx} ${r.code} ${r.title}`);

  if (!apply) {
    console.log('\n(dry-run) 반영하려면 --apply');
    await prisma.$disconnect();
    return;
  }

  const stats = { posts: 0, uploaded: 0, error: 0 };
  const insert = async (r: Crawled, withId: boolean) => {
    const createdAt = createdAtOf(r);
    const post = await prisma.post.create({
      data: {
        ...(withId ? { id: r.idx } : {}),
        code: r.code,
        title: norm(r.title) || '(제목 없음)',
        content: r.content,
        author: r.name || null,
        email: r.email || null,
        views: r.views || 0,
        isAdmin: TEAM_CODES.has(r.code),
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });
    stats.posts++;
    await attachFiles(r, post.id, stats);
  };
  const run = async (list: Crawled[], withId: boolean) => {
    let k = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (k < list.length) {
        const r = list[k++];
        await insert(r, withId);
        if (stats.posts % 50 === 0) console.log(`진행: 글 ${stats.posts} | 첨부 ${stats.uploaded}, 에러 ${stats.error}`);
      }
    }));
  };

  await run(keepId, true);
  // 명시 id로 넣은 뒤 시퀀스를 최대값으로 올려야 이후 자동 번호(새 글/겹친 글)가 충돌하지 않는다
  await prisma.$executeRawUnsafe(`SELECT setval('"Post_id_seq"', (SELECT MAX(id) FROM "Post"))`);
  await run(newId, false);

  console.log(`\n✨ 완료! 글 ${stats.posts}건, 첨부 ${stats.uploaded}개, 첨부 에러 ${stats.error}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
