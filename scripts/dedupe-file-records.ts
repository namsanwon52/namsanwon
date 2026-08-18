/**
 * (postId, filename)이 겹치는 File 레코드를 하나만 남기고 지운다.
 *
 * 발생 경위: 임포트를 포그라운드로 돌리다 타임아웃으로 셸만 종료되고 node 프로세스가
 * 살아남은 상태에서 같은 게시판 임포트를 다시 띄우면, 두 프로세스가 같은 게시물을
 * 동시에 처리해 File 레코드가 중복 생성된다. (임포트의 중복 스킵은 시작 시점
 * 스냅샷 기준이라 동시 실행을 막지 못한다.)
 *
 * 남기는 기준: Cloudinary URL 우선, 그 다음 id가 작은 것.
 * 지워지는 레코드가 가리키는 스토리지 객체는 남은 레코드와 같은 키이므로 건드리지 않는다.
 *
 * 기본은 드라이런이며 실제 삭제는 --apply 를 붙여야 한다.
 *
 * 실행:
 *   npx tsx scripts/dedupe-file-records.ts
 *   npx tsx scripts/dedupe-file-records.ts --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`${APPLY ? '🗑️  삭제 모드' : '🔍 드라이런'}\n`);

  const rows = await prisma.file.findMany({
    select: { id: true, postId: true, filename: true, url: true },
    orderBy: { id: 'asc' },
  });

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.postId}|${r.filename}`;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  const removeIds: number[] = [];
  let dupGroups = 0;
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    dupGroups++;
    // Cloudinary URL 우선, 동률이면 id 오름차순 첫 번째를 남긴다
    const sorted = [...g].sort((a, b) => {
      const ac = a.url.includes('res.cloudinary.com') ? 0 : 1;
      const bc = b.url.includes('res.cloudinary.com') ? 0 : 1;
      return ac !== bc ? ac - bc : a.id - b.id;
    });
    removeIds.push(...sorted.slice(1).map((r) => r.id));
  }

  console.log(`전체 File 레코드: ${rows.length}개`);
  console.log(`중복 그룹: ${dupGroups}개`);
  console.log(`삭제 대상: ${removeIds.length}개`);
  console.log(`정리 후: ${rows.length - removeIds.length}개\n`);

  if (!APPLY || removeIds.length === 0) {
    if (!APPLY) console.log('※ 드라이런입니다. 실제 삭제는 --apply 를 붙여 실행하세요.');
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  for (let i = 0; i < removeIds.length; i += 1000) {
    const res = await prisma.file.deleteMany({ where: { id: { in: removeIds.slice(i, i + 1000) } } });
    done += res.count;
    console.log(`  ${done}/${removeIds.length} 삭제`);
  }
  console.log(`\n✨ 완료: 중복 ${done}개 제거`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
