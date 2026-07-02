import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyPassword } from '@/lib/hash'

// 댓글 삭제 (관리자 세션 또는 비밀번호 확인)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: '없는 댓글' }, { status: 404 })

  const session = await getServerSession(authOptions)
  if (session) {
    await prisma.comment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  if (comment.password) {
    let body: { password?: string } = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })
    }
    if (!body.password) return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })
    const valid = await verifyPassword(body.password, comment.password)
    if (!valid) return NextResponse.json({ error: '비밀번호 불일치' }, { status: 403 })
    await prisma.comment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '권한 없음' }, { status: 401 })
}
