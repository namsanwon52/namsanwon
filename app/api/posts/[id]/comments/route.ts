import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hashPassword } from '@/lib/hash'

// 게시글 댓글 목록
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const postId = Number(idStr)
  if (isNaN(postId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, author: true, content: true, isAdmin: true, createdAt: true, password: true },
  })
  // 비밀번호 노출 방지 — 존재 여부만
  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      author: c.author,
      content: c.content,
      isAdmin: c.isAdmin,
      createdAt: c.createdAt,
      hasPassword: !!c.password,
    })),
  )
}

// 댓글 작성
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const postId = Number(idStr)
  if (isNaN(postId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const { author, password, content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: '내용을 입력하세요.' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })

  const session = await getServerSession(authOptions)
  // 비관리자는 비밀번호 필수 (수정/삭제 본인확인용)
  if (!session && !password) {
    return NextResponse.json({ error: '비밀번호를 입력하세요.' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      author: session ? '관리자' : author?.trim() || '익명',
      password: session ? null : await hashPassword(password),
      content: content.trim(),
      isAdmin: !!session,
    },
    select: { id: true, author: true, content: true, isAdmin: true, createdAt: true },
  })
  return NextResponse.json({ ...comment, hasPassword: !session }, { status: 201 })
}
