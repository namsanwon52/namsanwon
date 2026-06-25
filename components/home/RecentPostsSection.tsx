import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getRecentPosts(category: string, limit = 5) {
  return prisma.post.findMany({
    where: { category },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, createdAt: true },
  })
}

type Post = { id: number; title: string; createdAt: Date }

function PostCard({
  title,
  posts,
  href,
  category,
  accentColor,
}: {
  title: string
  posts: Post[]
  href: string
  category: string
  accentColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={`h-1 ${accentColor}`} />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <Link
            href={href}
            className="text-xs text-[#3B9EDA] hover:text-[#1a6fa8] font-medium flex items-center gap-0.5 transition-colors"
          >
            더보기
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <ul className="space-y-3">
          {posts.length === 0 ? (
            <li className="text-sm text-slate-400 py-4 text-center">게시글이 없습니다.</li>
          ) : (
            posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/board/${category}/${p.id}`}
                  className="flex items-center justify-between gap-3 group"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-[#3B9EDA] transition-colors truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#3B9EDA] flex-shrink-0 transition-colors" />
                    {p.title}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 bg-slate-50 px-2 py-0.5 rounded-full">
                    {p.createdAt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default async function RecentPostsSection() {
  const [notices, frees] = await Promise.all([
    getRecentPosts('notice'),
    getRecentPosts('free'),
  ])

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">최근 소식</h2>
        <div className="h-px flex-1 bg-slate-100 mx-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PostCard
          title="공지사항"
          posts={notices}
          href="/board/notice"
          category="notice"
          accentColor="bg-[#3B9EDA]"
        />
        <PostCard
          title="자유게시판"
          posts={frees}
          href="/board/free"
          category="free"
          accentColor="bg-[#FF7A59]"
        />
      </div>
    </section>
  )
}
