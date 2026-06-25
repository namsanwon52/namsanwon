import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedPost {
  idx: number;
  code: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  count: number;
  wdate: number;
  upfile1: string;
  upfile2: string;
  upfile3: string;
}

/**
 * VALUES 뒤의 단일 튜플 ( ... ) 을 문자 단위로 파싱.
 * 따옴표 상태와 백슬래시/'' 이스케이프를 추적하므로
 * content 안에 ) , ' ; 가 섞여 있어도 안전하다.
 */
function parseTuple(
  text: string,
  startIdx: number
): { values: string[]; endIdx: number } | null {
  let i = startIdx;
  while (i < text.length && text[i] !== '(') i++;
  if (i >= text.length) return null;
  i++; // '(' 스킵

  const values: string[] = [];

  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i >= text.length) break;

    if (text[i] === ')') {
      i++;
      return { values, endIdx: i };
    }

    if (text[i] === "'") {
      // 문자열 값
      i++; // 여는 따옴표
      let val = '';
      while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
          // 백슬래시 이스케이프 (\' \\ \" \n 등)
          const next = text[i + 1];
          if (next === 'n') val += '\n';
          else if (next === 'r') val += '\r';
          else if (next === 't') val += '\t';
          else val += next;
          i += 2;
        } else if (text[i] === "'" && text[i + 1] === "'") {
          // '' 이스케이프
          val += "'";
          i += 2;
        } else if (text[i] === "'") {
          // 닫는 따옴표
          i++;
          break;
        } else {
          val += text[i];
          i++;
        }
      }
      values.push(val);
    } else {
      // 숫자 또는 NULL (따옴표 없음)
      let val = '';
      while (i < text.length && text[i] !== ',' && text[i] !== ')') {
        val += text[i];
        i++;
      }
      const trimmed = val.trim();
      values.push(trimmed.toUpperCase() === 'NULL' ? '' : trimmed);
    }

    // 콤마 스킵
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i < text.length && text[i] === ',') i++;
  }

  return values.length > 0 ? { values, endIdx: i } : null;
}

function parseSQL(sqlContent: string): ParsedPost[] {
  const posts: ParsedPost[] = [];

  // 각 INSERT 문의 VALUES 위치를 모두 찾는다.
  const valuesRegex = /VALUES\s*(?=\()/gi;
  let match: RegExpExecArray | null;

  while ((match = valuesRegex.exec(sqlContent)) !== null) {
    const result = parseTuple(sqlContent, match.index + match[0].length);
    if (!result) continue;

    const v = result.values;
    if (v.length < 8) continue;

    const idx = parseInt(v[0]);
    const wdate = parseInt(v[7]);
    if (!idx || idx <= 0) continue;

    posts.push({
      idx,
      code: v[1] || '',
      name: v[2] || '',
      email: v[3] || '',
      subject: v[4] || '',
      content: v[5] || '',
      count: parseInt(v[6]) || 0,
      wdate: wdate || 0,
      upfile1: v[8] || '',
      upfile2: v[9] || '',
      upfile3: v[10] || '',
    });
  }

  return posts;
}

/** 크롤링 아티팩트(닫는 td/tr 태그 등) 제거 */
function cleanContent(html: string): string {
  return html
    .replace(/\s*<\/td>\s*<\/tr>\s*$/i, '')
    .replace(/\s*<\/td>\s*$/i, '')
    .trim();
}

async function importAll() {
  try {
    console.log('🔄 SQL 파싱 및 임포트 시작...\n');

    // 기존 데이터 초기화 (이전 임포트의 잘못된 데이터 제거)
    const existing = await prisma.post.count();
    if (existing > 0) {
      console.log(`🗑️  기존 ${existing}개 게시물 삭제 중...`);
      await prisma.post.deleteMany({});
      console.log('   완료\n');
    }

    const crawledDir = path.join(__dirname, '../docs/sql/crawled');
    const files = fs
      .readdirSync(crawledDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let grandTotal = 0;

    for (const file of files) {
      const filePath = path.join(crawledDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      const posts = parseSQL(sqlContent);
      console.log(`📝 ${file}: ${posts.length}개 파싱됨, 임포트 중...`);

      if (posts.length === 0) {
        console.log(`⏭️  ${file}: 데이터 없음 (건너뜀)`);
        continue;
      }

      let success = 0;

      // 배치로 나누어 createMany 사용 (충돌은 skipDuplicates로 무시)
      const BATCH = 500;
      for (let b = 0; b < posts.length; b += BATCH) {
        const batch = posts.slice(b, b + BATCH);
        try {
          const result = await prisma.post.createMany({
            data: batch.map((p) => ({
              id: p.idx,
              code: p.code,
              title: p.subject || '(제목 없음)',
              content: cleanContent(p.content),
              author: p.name || null,
              email: p.email || null,
              views: p.count,
              createdAt: new Date(p.wdate * 1000),
              updatedAt: new Date(p.wdate * 1000),
            })),
            skipDuplicates: true,
          });
          success += result.count;
        } catch (e) {
          // 배치 실패 시 개별 처리로 폴백
          for (const p of batch) {
            try {
              await prisma.post.create({
                data: {
                  id: p.idx,
                  code: p.code,
                  title: p.subject || '(제목 없음)',
                  content: cleanContent(p.content),
                  author: p.name || null,
                  email: p.email || null,
                  views: p.count,
                  createdAt: new Date(p.wdate * 1000),
                  updatedAt: new Date(p.wdate * 1000),
                },
              });
              success++;
            } catch {
              continue;
            }
          }
        }
      }

      console.log(`✅ ${file}: ${success}/${posts.length}개 임포트`);
      grandTotal += success;
    }

    const total = await prisma.post.count();
    console.log(`\n✨ 임포트 완료! DB 총 게시물: ${total}개\n`);

    const codes = ['nt1', 'nt2', 'nt3', 'nt4', 'com1', 'com3', 'liv1', 'liv2', 'dus3'];
    const labels: Record<string, string> = {
      nt1: '공지사항', nt2: '예산', nt3: '결산', nt4: '법인',
      com1: '자유게시판', com3: '갤러리',
      liv1: '아동생활', liv2: '영아방', dus3: '학교생활',
    };

    console.log('카테고리별 통계:');
    console.log('─'.repeat(40));
    for (const code of codes) {
      const count = await prisma.post.count({ where: { code } });
      console.log(`${labels[code].padEnd(12)}: ${count.toString().padStart(6)}개`);
    }
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('❌ 임포트 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importAll();
