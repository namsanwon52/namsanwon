import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateCache, CACHE_TAGS } from '@/lib/cache'
import { hashPassword } from '@/lib/hash'
import { getBoardMeta } from '@/lib/board'
import { toFileRows } from '@/lib/post-files'
import { canViewBoard, getBoardWriter, isAdminWriter } from '@/lib/boardAccess'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'nt1'
  if (!(await canViewBoard(category))) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
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
  const { category, title, content, author, password, isSecret, files } = body

  if (!category || !title || !content) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  const writer = await getBoardWriter(category)
  if (!writer) {
    const meta = getBoardMeta(category)
    return meta.adminOnly
      ? NextResponse.json({ error: '관리자 권한 필요' }, { status: 401 })
      : NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const asAdmin = isAdminWriter(writer)

  const hashedPassword = password ? await hashPassword(password) : null
  // 작성자명: 관리자 화면 로그인은 입력값 허용, 회원(관리자 등급 포함)은 세션의 이름(도용 방지)
  const authorName = writer.kind === 'admin' ? author || '관리자' : writer.name || '회원'

  const post = await prisma.post.create({
    data: {
      code: category,
      title,
      content,
      author: authorName,
      password: hashedPassword,
      isAdmin: asAdmin,
      isSecret: !!isSecret,
      // 첨부파일은 관리자(관리자 등급 회원 포함)만 올린다
      ...(asAdmin && { files: { create: toFileRows(files) } }),
    },
  })

  invalidateCache(CACHE_TAGS.posts)
  return NextResponse.json(post, { status: 201 })
}
