/**
 * 크롤링 단계에서 빈 값(제목/본문 없음)으로 수집된 게시판을 전체 DB 덤프
 * (docs/sql/260513_namsan.sql, wiz_bbs)로 복구한다.
 *
 * - 덤프에 있는 글: 같은 id(=idx)가 DB에 있으면 제목/본문/작성자/조회수/작성일을 덮어쓰고, 없으면 새로 만든다.
 * - DB에만 있고 덤프에 없는 글: 기본은 목록만 출력. --delete-orphans 지정 시, 비어 있는 글(제목 없음 + 본문 없음)만 삭제.
 * - 비밀글 여부(privacy='Y')와 글 비밀번호(passwd, 평문)도 함께 옮긴다. 비밀번호는 bcrypt 해시로 저장.
 *   (크롤러는 비밀글 본문을 볼 수 없어 비밀글 자체가 누락됐다.)
 * - 기본은 dry-run(비밀번호는 출력하지 않음). 실제 반영은 --apply.
 *
 * 실행: npx tsx prisma/restore-from-dump.ts nt4 [--apply] [--delete-orphans]
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/hash';

const prisma = new PrismaClient();

const DUMP = path.join(__dirname, '../docs/sql/260513_namsan.sql');
const EMPTY_TITLE = '(제목 없음)';

// wiz_bbs 컬럼 인덱스 (60컬럼)
const COL = { idx: 0, code: 1, name: 9, email: 11, subject: 16, content: 17, privacy: 25, passwd: 53, count: 54, wdate: 58 };

/** VALUES 뒤 단일 튜플을 문자 단위로 파싱 (백슬래시/'' 이스케이프 처리) */
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

function cleanContent(html: string): string {
  return html
    .replace(/\s*<\/td>\s*<\/tr>\s*$/i, '')
    .replace(/\s*<\/td>\s*$/i, '')
    .trim();
}

type Row = { idx: number; title: string; content: string; author: string | null; email: string | null; views: number; wdate: number; secret: boolean; passwd: string };

function parseDump(sql: string, code: string): Row[] {
  const rows: Row[] = [];
  const re = /VALUES\s*(?=\()/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    let pos = m.index + m[0].length;
    while (true) {
      const r = parseTuple(sql, pos);
      if (!r) break;
      const v = r.values;
      pos = r.endIdx;
      if (v.length >= 59 && v[COL.code] === code) {
        const idx = parseInt(v[COL.idx]);
        if (idx > 0) {
          rows.push({
            idx,
            title: (v[COL.subject] || '').trim() || EMPTY_TITLE,
            content: cleanContent(v[COL.content] || ''),
            author: v[COL.name] || null,
            email: v[COL.email] || null,
            views: parseInt(v[COL.count]) || 0,
            wdate: parseInt(v[COL.wdate]) || 0,
            secret: v[COL.privacy] === 'Y',
            passwd: v[COL.passwd] || '',
          });
        }
      }
      while (pos < sql.length && /\s/.test(sql[pos])) pos++;
      if (sql[pos] === ',') { pos++; continue; }
      break;
    }
  }
  return rows;
}

async function main() {
  const code = process.argv[2];
  if (!code || code.startsWith('--')) {
    console.error('사용법: npx tsx prisma/restore-from-dump.ts <code> [--apply] [--delete-orphans]');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const deleteOrphans = process.argv.includes('--delete-orphans');

  const rows = parseDump(fs.readFileSync(DUMP, 'utf-8'), code);
  const db = await prisma.post.findMany({
    where: { code },
    select: { id: true, title: true, content: true, _count: { select: { files: true, comments: true } } },
  });
  const dbById = new Map(db.map((p) => [p.id, p]));
  const dumpIds = new Set(rows.map((r) => r.idx));

  const toUpdate = rows.filter((r) => dbById.has(r.idx));
  const toCreate = rows.filter((r) => !dbById.has(r.idx));
  const orphans = db.filter((p) => !dumpIds.has(p.id));
  const emptyOrphans = orphans.filter((p) => p.title === EMPTY_TITLE && !p.content && !p._count.files && !p._count.comments);

  console.log(`[${code}] 덤프 ${rows.length}건 / DB ${db.length}건 (DB 중 빈 글 ${db.filter((p) => p.title === EMPTY_TITLE).length}건)`);
  console.log(`  비밀글 ${rows.filter((r) => r.secret).length}건 (비밀번호 없는 비밀글 ${rows.filter((r) => r.secret && !r.passwd).length}건)`);
  console.log(`  덮어쓰기 ${toUpdate.length}, 신규 ${toCreate.length}, DB에만 있음 ${orphans.length} (그중 완전히 빈 글 ${emptyOrphans.length})`);
  for (const r of rows.slice().sort((a, b) => b.wdate - a.wdate)) {
    const d = new Date(r.wdate * 1000).toISOString().slice(0, 10);
    console.log(`  ${dbById.has(r.idx) ? '수정' : '신규'} #${r.idx} ${d} ${r.secret ? '🔒 ' : ''}${r.title}`);
  }
  if (orphans.length) console.log(`  DB에만 있는 id: ${orphans.map((p) => p.id).join(', ')}`);

  if (!apply) {
    console.log('\n(dry-run) 반영하려면 --apply');
    await prisma.$disconnect();
    return;
  }

  for (const r of rows) {
    const data = {
      title: r.title,
      content: r.content,
      author: r.author,
      email: r.email,
      views: r.views,
      createdAt: r.wdate ? new Date(r.wdate * 1000) : new Date(),
      updatedAt: r.wdate ? new Date(r.wdate * 1000) : new Date(),
      isSecret: r.secret,
      password: r.passwd ? await hashPassword(r.passwd) : null,
    };
    await prisma.post.upsert({ where: { id: r.idx }, update: data, create: { id: r.idx, code, ...data } });
  }
  console.log(`\n✅ 덤프 ${rows.length}건 반영`);

  if (deleteOrphans && emptyOrphans.length) {
    const res = await prisma.post.deleteMany({ where: { id: { in: emptyOrphans.map((p) => p.id) } } });
    console.log(`🗑️  빈 글 ${res.count}건 삭제`);
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
