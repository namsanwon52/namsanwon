import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { del } from '@vercel/blob'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const id = Number(idStr)
  const body = await req.json()

  if (body.order !== undefined) {
    const duplicate = await prisma.sliderImage.findFirst({ where: { order: body.order, NOT: { id } } })
    if (duplicate) {
      return NextResponse.json({ error: `이미 사용 중인 순서입니다. (순서: ${body.order})` }, { status: 409 })
    }
  }

  const image = await prisma.sliderImage.update({ where: { id }, data: body })
  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const image = await prisma.sliderImage.delete({ where: { id: Number(idStr) } })

  if (/^https:\/\/.*\.public\.blob\.vercel-storage\.com\//.test(image.url)) {
    try {
      await del(image.url)
    } catch (err) {
      console.error('Blob 파일 삭제 실패:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
