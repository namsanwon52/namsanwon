import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { getBoardMeta } from '@/lib/board'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PostActionsPublic from '@/components/board/PostActionsPublic'

type Props = { params: Promise<{ category: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id: idStr } = await params
  const post = await prisma.post.findUnique({
    where: { id: Number(idStr) },
    select: { title: true },
  })
  return { title: post?.title ?? '게시글' }
}

export default async function PostDetailPage({ params }: Props) {
  const { category, id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) notFound()

  const post = await prisma.post.findUnique({
    where: { id },
    include: { files: true },
  })
  if (!post || post.category !== category) notFound()

  // 조회수 증가 (응답 속도에 영향 없도록 await 생략)
  prisma.post.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { category, createdAt: { lt: post.createdAt }, id: { not: id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.post.findFirst({
      where: { category, createdAt: { gt: post.createdAt }, id: { not: id } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    }),
  ])

  const session = await getServerSession(authOptions)
  const meta = getBoardMeta(category)

  return (
    <>
      <PageHeader title={meta.label} breadcrumb={['게시판', meta.label]} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* 제목 */}
          <h2 className="text-xl font-bold text-[#3D2B1F] border-b-2 border-[#E8863A] pb-3 mb-4">
            {post.title}
          </h2>
          {/* 메타 정보 */}
          <div className="flex gap-4 text-sm text-gray-400 mb-6">
            <span>작성자: {post.author}</span>
            <span>날짜: {post.createdAt.toLocaleDateString('ko-KR')}</span>
            <span>조회: {post.views}</span>
          </div>
          {/* 본문 */}
          <div
            className="prose max-w-none min-h-[200px] text-[#3D2B1F]/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {/* 첨부파일 */}
          {post.files.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-bold text-[#3D2B1F] mb-2">첨부파일</h3>
              <ul className="space-y-1">
                {post.files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.url}
                      className="text-sm text-[#E8863A] hover:underline"
                      download={f.filename}
                    >
                      📎 {f.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* 이전글 / 다음글 */}
        <div className="mt-4 border rounded-xl overflow-hidden bg-white shadow-sm text-sm">
          {nextPost && (
            <Link
              href={`/board/${category}/${nextPost.id}`}
              className="flex items-center gap-3 px-5 py-3 border-b hover:bg-slate-50 transition-colors"
            >
              <span className="text-[#3B9EDA] font-medium w-12 flex-shrink-0">다음글</span>
              <span className="text-slate-700 truncate">{nextPost.title}</span>
            </Link>
          )}
          {prevPost && (
            <Link
              href={`/board/${category}/${prevPost.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-400 font-medium w-12 flex-shrink-0">이전글</span>
              <span className="text-slate-700 truncate">{prevPost.title}</span>
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <Link
            href={`/board/${category}`}
            className="text-sm text-gray-500 hover:text-[#E8863A] transition-colors"
          >
            ← 목록으로
          </Link>
          <PostActionsPublic
            id={id}
            category={category}
            isAdmin={!!session}
            hasPassword={!!post.password}
          />
        </div>
      </div>
    </>
  )
}
