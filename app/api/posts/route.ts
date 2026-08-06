import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMemberSession } from '@/lib/memberSession'
import { hashPassword } from '@/lib/hash'
import { getBoardMeta } from '@/lib/board'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'nt1'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 10
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { code: category },
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
    prisma.post.count({ where: { code: category } }),
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
  const { category, title, content, author, password, isSecret } = body

  if (!category || !title || !content) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  const meta = getBoardMeta(category)
  const session = await getServerSession(authOptions)

  if (meta.adminOnly) {
    if (!session) {
      return NextResponse.json({ error: '관리자 권한 필요' }, { status: 401 })
    }
  }

  // 공개 게시판(자유게시판 등)은 로그인한 회원(또는 관리자)만 작성 가능
  const member = meta.adminOnly ? null : await getMemberSession()
  if (!meta.adminOnly && !session && !member) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const hashedPassword = password ? await hashPassword(password) : null
  // 작성자명은 세션을 신뢰(회원 도용 방지). 관리자는 입력값 허용.
  const authorName = session ? author || '관리자' : member?.name || '회원'

  const post = await prisma.post.create({
    data: {
      code: category,
      title,
      content,
      author: authorName,
      password: hashedPassword,
      isAdmin: !!session,
      isSecret: !!isSecret,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
