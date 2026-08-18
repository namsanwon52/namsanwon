/**
 * 지정한 스토어 경로(prefix)를 가리키는 File 레코드를 삭제한다.
 *
 * 용도: Vercel Blob → R2 이전. import 스크립트들은 "이미 File 레코드가 있으면 건너뛴다"로
 * 재실행 안전성을 확보하므로, 죽은 Vercel Blob URL을 가리키는 레코드를 먼저 지워야
 * `import-gallery-thumbnails.ts` / `import-team-files.ts` 가 R2로 다시 올린다.
 *
 * Post 등 다른 테이블은 건드리지 않는다. File 은 게시물 첨부 연결일 뿐이라
 * 재임포트로 동일하게 복원된다.
 *
 * 기본은 드라이런이며 실제 삭제는 --apply 를 붙여야 한다.
 *
 * 실행:
 *   npx tsx scripts/reset-file-records.ts --prefix=gallery/com3
 *   npx tsx scripts/reset-file-records.ts --apply --prefix=gallery/ --prefix=teamfiles/
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const PREFIXES = process.argv
  .filter((a) => a.startsWith('--prefix='))
  .map((a) => a.slice('--prefix='.length))
  .filter(Boolean);

/** URL에서 스토어 키를 뽑는다 (Vercel Blob / R2 양쪽 형태 모두) */
function keyOf(url: string): string | null {
  const vercel = url.match(/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/(.+)$/);
  if (vercel) return decodeURIComponent(vercel[1]);
  const generic = url.match(/^https?:\/\/[^/]+\/(.+)$/);
  return generic ? decodeURIComponent(generic[1]) : null;
}

async function main() {
  if (PREFIXES.length === 0) {
    console.error('❌ --prefix= 를 하나 이상 지정하세요.');
    process.exit(1);
  }

  console.log(`${APPLY ? '🗑️  삭제 모드' : '🔍 드라이런'} | prefix: ${PREFIXES.join(', ')}\n`);

  const rows = await prisma.file.findMany({ select: { id: true, url: true } });
  const targets = rows.filter((r) => {
    const key = keyOf(r.url);
    return key !== null && PREFIXES.some((p) => key.startsWith(p));
  });

  console.log(`전체 File 레코드: ${rows.length}개`);
  console.log(`삭제 대상: ${targets.length}개`);
  console.log(`삭제 후 남는 레코드: ${rows.length - targets.length}개\n`);

  for (const p of PREFIXES) {
    const n = targets.filter((r) => (keyOf(r.url) ?? '').startsWith(p)).length;
    console.log(`  ${p.padEnd(20)} ${String(n).padStart(6)}개`);
  }

  if (!APPLY) {
    console.log('\n※ 드라이런입니다. 실제 삭제는 --apply 를 붙여 실행하세요.');
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  const ids = targets.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 1000) {
    const res = await prisma.file.deleteMany({ where: { id: { in: ids.slice(i, i + 1000) } } });
    done += res.count;
    console.log(`  ${done}/${ids.length} 삭제`);
  }

  console.log(`\n✨ 완료: File 레코드 ${done}개 삭제. 이제 import 스크립트로 R2에 재업로드하세요.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
