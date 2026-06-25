import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hashPassword } from '@/lib/hash'
import { getBoardMeta } from '@/lib/board'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'notice'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 10
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        author: true,
        views: true,
        createdAt: true,
        isAdmin: true,
      },
    }),
    prisma.post.count({ where: { category } }),
  ])

  return NextResponse.json({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { category, title, content, author, password } = body

  if (!category || !title || !content) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  const meta = getBoardMeta(category)
  const session = await getServerSession(authOptions)

  if (meta.adminOnly && !session) {
    return NextResponse.json({ error: '관리자 권한 필요' }, { status: 401 })
  }

  const hashedPassword = password ? await hashPassword(password) : null

  const post = await prisma.post.create({
    data: {
      category,
      title,
      content,
      author: author || '익명',
      password: hashedPassword,
      isAdmin: !!session,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
