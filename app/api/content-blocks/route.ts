import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page')
  const blocks = await prisma.contentBlock.findMany({
    where: page ? { page } : undefined,
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(blocks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const { page, type, title, content, imageUrl, imageAlt } = body
  if (!page || !type) return NextResponse.json({ error: 'page, type는 필수입니다.' }, { status: 400 })

  const last = await prisma.contentBlock.findFirst({ where: { page }, orderBy: { order: 'desc' } })
  const order = (last?.order ?? 0) + 1

  const block = await prisma.contentBlock.create({
    data: {
      page,
      type,
      title: title ?? '',
      content: content ?? '',
      imageUrl: imageUrl ?? '',
      imageAlt: imageAlt ?? '',
      order,
    },
  })
  return NextResponse.json(block, { status: 201 })
}
