/**
 * 잔여 마이그레이션 데이터 정리 (wdate 없는 게시글이 현재 날짜로 삽입된 경우)
 * 신규 사이트의 실제 최신 게시물(2026-05-18 이전)은 보존
 * 실행: npx tsx prisma/cleanup-residual.ts [YYYY-MM-DD]
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dateArg = process.argv[2]
  if (!dateArg) {
    console.error('사용법: npx tsx prisma/cleanup-residual.ts YYYY-MM-DD')
    console.error('예) npx tsx prisma/cleanup-residual.ts 2026-05-19')
    process.exit(1)
  }

  const dayStart = new Date(`${dateArg}T00:00:00.000Z`)
  const dayEnd   = new Date(`${dateArg}T23:59:59.999Z`)

  const count = await prisma.post.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  })
  console.log(`${dateArg} 생성 게시글: ${count}건`)

  if (count === 0) { console.log('삭제할 데이터 없음'); return }

  const deleted = await prisma.post.deleteMany({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  })
  console.log(`삭제 완료: ${deleted.count}건`)
  console.log(`남은 게시글: ${await prisma.post.count()}건`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
