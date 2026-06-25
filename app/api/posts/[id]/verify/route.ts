import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/hash'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const { password } = await req.json()
  if (!password) return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })
  if (!post.password) return NextResponse.json({ error: '비밀번호 없는 게시글' }, { status: 400 })

  const valid = await verifyPassword(password, post.password)
  if (!valid) return NextResponse.json({ error: '비밀번호 불일치' }, { status: 403 })

  return NextResponse.json({ ok: true })
}
