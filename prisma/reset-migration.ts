/**
 * 마이그레이션 데이터 전체 삭제
 * - createdAt < 2026-05-14 : 구형 DB 마이그레이션 데이터
 * - id > 100 : 마이그레이션 생성 데이터 (신규 사이트 게시글은 소수 ID)
 * 두 조건 OR로 삭제하여 잔여 마이그레이션 데이터를 모두 제거
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.post.count()
  console.log(`현재 총 게시글: ${total}건`)

  // 신규 사이트 게시글 확인 (보존 대상)
  const keepPosts = await prisma.post.findMany({
    where: { createdAt: { gte: new Date('2026-05-14T00:00:00.000Z') } },
    select: { id: true, category: true, createdAt: true, title: true },
    orderBy: { id: 'asc' },
  })
  console.log(`\n보존할 신규 사이트 게시글 (${keepPosts.length}건):`)
  keepPosts.forEach(p => console.log(`  id:${p.id} [${p.category}] ${p.createdAt.toISOString().slice(0,10)} - ${p.title?.slice(0,40)}`))

  const keepIds = keepPosts.map(p => p.id)

  // 보존 ID 외 전체 삭제
  const count = await prisma.post.count({
    where: { id: { notIn: keepIds } },
  })
  console.log(`\n삭제 대상: ${count}건`)

  if (count === 0) { console.log('삭제할 데이터 없음'); return }

  const deleted = await prisma.post.deleteMany({
    where: { id: { notIn: keepIds } },
  })
  console.log(`삭제 완료: ${deleted.count}건`)
  console.log(`남은 게시글: ${await prisma.post.count()}건`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
