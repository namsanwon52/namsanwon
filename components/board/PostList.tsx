import Link from 'next/link'
import { prisma } from '@/lib/prisma'

type Props = { category: string; page: number }

export default async function PostList({ category, page }: Props) {
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

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-[#3B9EDA]">
              <th className="py-3.5 px-4 text-center w-16 text-slate-500 font-medium">번호</th>
              <th className="py-3.5 px-4 text-left text-slate-500 font-medium">제목</th>
              <th className="py-3.5 px-4 text-center w-24 text-slate-500 font-medium">작성자</th>
              <th className="py-3.5 px-4 text-center w-28 text-slate-500 font-medium">날짜</th>
              <th className="py-3.5 px-4 text-center w-16 text-slate-500 font-medium">조회</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    게시글이 없습니다.
                  </div>
                </td>
              </tr>
            ) : (
              posts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-[#EBF5FF]/40 transition-colors group">
                  <td className="py-3.5 px-4 text-center text-slate-400 text-xs">
                    {total - skip - idx}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/board/${category}/${p.id}`}
                      className="hover:text-[#3B9EDA] transition-colors flex items-center gap-2"
                    >
                      {p.isAdmin && (
                        <span className="bg-[#FF7A59] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          공지
                        </span>
                      )}
                      <span className="group-hover:text-[#3B9EDA] transition-colors">{p.title}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500">{p.author}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400 text-xs">{p.views}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const GROUP_SIZE = 10
        const groupStart = Math.floor((page - 1) / GROUP_SIZE) * GROUP_SIZE + 1
        const groupEnd = Math.min(groupStart + GROUP_SIZE - 1, totalPages)
        const hasPrev = groupStart > 1
        const hasNext = groupEnd < totalPages
        const btnBase = 'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all'
        const btnInactive = 'bg-white border border-slate-200 hover:border-[#3B9EDA] hover:text-[#3B9EDA] text-slate-600'
        const btnActive = 'bg-[#3B9EDA] text-white shadow-sm'
        const btnNav = 'bg-white border border-slate-200 hover:border-[#3B9EDA] hover:text-[#3B9EDA] text-slate-500'

        return (
          <div className="flex justify-center gap-1.5 mt-6">
            {hasPrev && (
              <Link href={`?page=${groupStart - 1}`} className={`${btnBase} ${btnNav}`}>
                {'‹'}
              </Link>
            )}
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map((p) => (
              <Link
                key={p}
                href={`?page=${p}`}
                className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
              >
                {p}
              </Link>
            ))}
            {hasNext && (
              <Link href={`?page=${groupEnd + 1}`} className={`${btnBase} ${btnNav}`}>
                {'›'}
              </Link>
            )}
          </div>
        )
      })()}
    </div>
  )
}
