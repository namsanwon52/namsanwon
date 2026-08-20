import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseHistoryInput } from '@/lib/history'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const id = Number(idStr)
  const body = await req.json()

  // 활성/비활성 토글은 나머지 값 없이 active만 보낸다.
  if (Object.keys(body).length === 1 && typeof body.active === 'boolean') {
    const toggled = await prisma.historyEntry.update({ where: { id }, data: { active: body.active } })
    return NextResponse.json(toggled)
  }

  const parsed = parseHistoryInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const entry = await prisma.historyEntry.update({ where: { id }, data: parsed.data })
  return NextResponse.json(entry)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  await prisma.historyEntry.delete({ where: { id: Number(idStr) } })
  return NextResponse.json({ ok: true })
}
