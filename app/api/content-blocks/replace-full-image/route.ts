import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { del } from '@vercel/blob'

const isBlobUrl = (url: string) => /^https:\/\/.*\.public\.blob\.vercel-storage\.com\//.test(url)

// 해당 page의 기존 블럭을 전부 삭제하고, 페이지 전체를 차지하는 단일 배너 이미지 블럭으로 교체한다.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const { page, imageUrl, imageAlt } = body
  if (!page || !imageUrl) return NextResponse.json({ error: 'page, imageUrl은 필수입니다.' }, { status: 400 })

  const existing = await prisma.contentBlock.findMany({ where: { page } })

  await prisma.contentBlock.deleteMany({ where: { page } })

  for (const b of existing) {
    if (isBlobUrl(b.imageUrl)) {
      try {
        await del(b.imageUrl)
      } catch (err) {
        console.error('Blob 파일 삭제 실패:', err)
      }
    }
  }

  const block = await prisma.contentBlock.create({
    data: {
      page,
      type: 'full-image',
      title: '',
      content: '',
      imageUrl,
      imageAlt: imageAlt ?? '',
      order: 1,
    },
  })

  return NextResponse.json(block, { status: 201 })
}
