import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await prisma.pageContent.findUnique({ where: { slug } })
  if (!page) return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { slug } = await params
  const { title, content } = await req.json()
  if (typeof content !== 'string') {
    return NextResponse.json({ error: '내용이 필요합니다.' }, { status: 400 })
  }

  const page = await prisma.pageContent.upsert({
    where: { slug },
    update: { title: title ?? undefined, content },
    create: { slug, title: title ?? slug, content },
  })
  return NextResponse.json(page)
}
