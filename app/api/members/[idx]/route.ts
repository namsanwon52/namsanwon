import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idx: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { idx: idxStr } = await params
  const idx = Number(idxStr)
  if (isNaN(idx)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const member = await prisma.member.findUnique({ where: { idx } })
  if (!member) return NextResponse.json({ error: '없는 회원' }, { status: 404 })

  return NextResponse.json(member)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ idx: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { idx: idxStr } = await params
  const idx = Number(idxStr)
  if (isNaN(idx)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const body = await req.json()
  const { name, nick, email, hphone, address1, isAdmin } = body

  const member = await prisma.member.update({
    where: { idx },
    data: { name, nick, email, hphone, address1, isAdmin },
  })

  return NextResponse.json(member)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idx: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { idx: idxStr } = await params
  const idx = Number(idxStr)
  if (isNaN(idx)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  await prisma.member.delete({ where: { idx } })
  return NextResponse.json({ ok: true })
}
