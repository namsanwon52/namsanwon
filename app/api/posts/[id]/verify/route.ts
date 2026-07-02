import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/hash'

// 비밀번호 확인. 성공 시 전체 게시글(본문/첨부 포함)을 반환한다.
// 비밀글 열람 및 수정 진입에 사용.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const { password } = await req.json()
  if (!password) return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id }, include: { files: true } })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })
  if (!post.password) return NextResponse.json({ error: '비밀번호 없는 게시글' }, { status: 400 })

  const valid = await verifyPassword(password, post.password)
  if (!valid) return NextResponse.json({ error: '비밀번호 불일치' }, { status: 403 })

  return NextResponse.json({ ok: true, post })
}
