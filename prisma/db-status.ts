import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const total = await prisma.post.count()
  console.log('총:', total)

  const pre2025 = await prisma.post.count({ where: { createdAt: { lt: new Date('2025-01-01') } } })
  const yr2025  = await prisma.post.count({ where: { createdAt: { gte: new Date('2025-01-01'), lt: new Date('2026-01-01') } } })
  const yr2026  = await prisma.post.count({ where: { createdAt: { gte: new Date('2026-01-01') } } })
  console.log('2025 이전:', pre2025)
  console.log('2025년:', yr2025)
  console.log('2026년:', yr2026)

  const byCategory = await prisma.post.groupBy({ by: ['category'], _count: true })
  console.log('\n카테고리:')
  byCategory.forEach(r => console.log(' ', r.category, r._count))

  // 2026년 게시글 날짜 분포
  const y2026posts = await prisma.post.findMany({
    where: { createdAt: { gte: new Date('2026-01-01') } },
    select: { id: true, category: true, createdAt: true, title: true },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })
  console.log('\n2026년 이후 게시글 (최초 10건):')
  y2026posts.forEach(r => console.log(` id:${r.id} [${r.category}] ${r.createdAt.toISOString()} - ${r.title?.substring(0,30)}...`))

  const newestPosts = await prisma.post.findMany({
    where: { createdAt: { gte: new Date('2026-01-01') } },
    select: { id: true, category: true, createdAt: true, title: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  console.log('\n2026년 최신 5건:')
  newestPosts.forEach(r => console.log(` id:${r.id} [${r.category}] ${r.createdAt.toISOString()} - ${r.title?.substring(0,30)}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
