/**
 * 사업소개 팀별 게시판(행정/자립/교육/보육) 텍스트 데이터를 전체 DB 덤프
 * (docs/sql/260513_namsan.sql, wiz_bbs)에서 직접 파싱해 Post 테이블에 추가한다.
 *
 * - 기존 게시물은 절대 삭제하지 않는다 (createMany skipDuplicates, id=idx 충돌 시 스킵).
 * - 첨부 이미지/파일은 별도 스크립트(import-team-files.ts)에서 라이브 서버 크롤링으로 연결.
 *
 * 실행: npx tsx prisma/import-team-boards.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DUMP = path.join(__dirname, '../docs/sql/260513_namsan.sql');

// 팀별 게시판 코드 (자원봉사 소식 schedule 포함)
// argv[2]로 특정 코드만 지정 가능 (예: com6 역사사진)
const DEFAULT_CODES = [
  'bus1', 'bus2', 'bus3', 'bus7', // 행정지원팀 계열
  'cus1', 'cus2', 'cus11', 'cus21', // 후원/홍보/보육
  'dus1', 'dus2', // 교육지원팀
  'eus1', // 자립지원팀
  'schedule', // 자원봉사 소식(달력 → 일반 목록)
];
const TEAM_CODES = new Set(process.argv[2] ? [process.argv[2]] : DEFAULT_CODES);

// wiz_bbs 컬럼 인덱스 (60컬럼)
const COL = { idx: 0, code: 1, name: 9, email: 11, subject: 16, content: 17, count: 54, wdate: 58 };

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
        } else if (text[i] === "'" && text[i + 1] === "'") {
          val += "'";
          i += 2;
        } else if (text[i] === "'") {
          i++;
          break;
        } else {
          val += text[i];
          i++;
        }
      }
      values.push(val);
    } else {
      let val = '';
      while (i < text.length && text[i] !== ',' && text[i] !== ')') {
        val += text[i];
        i++;
      }
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

type Row = { idx: number; code: string; title: string; content: string; author: string | null; email: string | null; views: number; wdate: number };

function parseDump(sql: string): Row[] {
  const rows: Row[] = [];
  const re = /VALUES\s*(?=\()/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    // 하나의 INSERT에 여러 튜플이 콤마로 이어질 수 있으므로 연속 파싱
    let pos = m.index + m[0].length;
    while (true) {
      const r = parseTuple(sql, pos);
      if (!r) break;
      const v = r.values;
      pos = r.endIdx;
      if (v.length >= 59) {
        const code = v[COL.code] || '';
        const idx = parseInt(v[COL.idx]);
        if (TEAM_CODES.has(code) && idx > 0) {
          rows.push({
            idx,
            code,
            title: v[COL.subject] || '(제목 없음)',
            content: cleanContent(v[COL.content] || ''),
            author: v[COL.name] || null,
            email: v[COL.email] || null,
            views: parseInt(v[COL.count]) || 0,
            wdate: parseInt(v[COL.wdate]) || 0,
          });
        }
      }
      // 다음 튜플로: 공백 후 콤마면 계속, 아니면 이 INSERT 종료
      while (pos < sql.length && /\s/.test(sql[pos])) pos++;
      if (sql[pos] === ',') { pos++; continue; }
      break;
    }
  }
  return rows;
}

async function main() {
  console.log('🔄 팀 게시판 임포트 시작 (덤프 파싱)...\n');
  const sql = fs.readFileSync(DUMP, 'utf-8');
  const rows = parseDump(sql);
  console.log(`파싱된 팀 게시물: ${rows.length}개`);

  const byCode: Record<string, number> = {};
  for (const r of rows) byCode[r.code] = (byCode[r.code] || 0) + 1;
  console.log('코드별:', byCode, '\n');

  const before = await prisma.post.count();
  let inserted = 0;
  const BATCH = 500;
  for (let b = 0; b < rows.length; b += BATCH) {
    const batch = rows.slice(b, b + BATCH);
    const res = await prisma.post.createMany({
      data: batch.map((p) => ({
        id: p.idx,
        code: p.code,
        title: p.title,
        content: p.content,
        author: p.author,
        email: p.email,
        views: p.views,
        isAdmin: true,
        createdAt: p.wdate ? new Date(p.wdate * 1000) : new Date(),
        updatedAt: p.wdate ? new Date(p.wdate * 1000) : new Date(),
      })),
      skipDuplicates: true,
    });
    inserted += res.count;
    if ((b + BATCH) % 2000 === 0 || b + BATCH >= rows.length) {
      console.log(`진행: ${Math.min(b + BATCH, rows.length)}/${rows.length} | 신규 ${inserted}`);
    }
  }

  const after = await prisma.post.count();
  console.log(`\n✨ 완료! 신규 삽입 ${inserted}개 (전체 Post ${before} → ${after})`);

  console.log('\n코드별 DB 게시물 수:');
  for (const code of TEAM_CODES) {
    const n = await prisma.post.count({ where: { code } });
    console.log(`  ${code.padEnd(9)}: ${n}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
