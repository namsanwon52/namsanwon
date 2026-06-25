import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const post = await prisma.post.findUnique({
    where: { id },
    include: { files: true },
  })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })

  // 조회수 증가 (await 생략으로 응답 속도 최적화)
  prisma.post.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  return NextResponse.json(post)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const body = await req.json()
  const { title, content, author } = body

  const post = await prisma.post.update({
    where: { id },
    data: { title, content, author, updatedAt: new Date() },
  })

  return NextResponse.json(post)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })

  // 관리자 세션이 있으면 바로 삭제
  if (session) {
    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  // 비밀번호로 작성된 게시글은 비밀번호 확인 후 삭제
  if (post.password) {
    let body: { password?: string } = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })
    }
    if (!body.password) return NextResponse.json({ error: '비밀번호 필요' }, { status: 400 })
    const { verifyPassword } = await import('@/lib/hash')
    const valid = await verifyPassword(body.password, post.password)
    if (!valid) return NextResponse.json({ error: '비밀번호 불일치' }, { status: 403 })
    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '권한 없음' }, { status: 401 })
}
