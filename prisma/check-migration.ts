import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.post.count()
  const byCategory = await prisma.post.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  console.log(`총 게시물 수: ${total}`)
  console.log('\n카테고리별 게시물:')
  byCategory.forEach(c => {
    console.log(`  ${c.category}: ${c._count.id}건`)
  })

  const fileCount = await prisma.file.count()
  console.log(`\n첨부파일 수: ${fileCount}건`)

  // 가장 오래된 게시물과 최근 게시물의 createdAt 확인
  const oldest = await prisma.post.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, category: true, title: true, createdAt: true },
  })
  const newest = await prisma.post.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, category: true, title: true, createdAt: true },
  })

  console.log('\n가장 오래된 게시물:', oldest)
  console.log('가장 최근 게시물:', newest)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
