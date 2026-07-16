import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { del } from '@vercel/blob'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const body = await req.json()
  const block = await prisma.contentBlock.update({ where: { id: Number(idStr) }, data: body })
  return NextResponse.json(block)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const block = await prisma.contentBlock.delete({ where: { id: Number(idStr) } })

  if (/^https:\/\/.*\.public\.blob\.vercel-storage\.com\//.test(block.imageUrl)) {
    try {
      await del(block.imageUrl)
    } catch (err) {
      console.error('Blob 파일 삭제 실패:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
