import Link from 'next/link'
import { prisma } from '@/lib/prisma'

type Props = { category: string; page: number }

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('ko-KR').replace(/\.$/, '')
}

export default async function PostList({ category, page }: Props) {
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

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <table className="boardTable">
        <thead>
          <tr>
            <th className="colNo">번호</th>
            <th className="colTitle">제목</th>
            <th className="colAuthor">작성자</th>
            <th className="colDate">작성일</th>
            <th className="colViews">조회</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="boardEmpty">등록된 게시글이 없습니다.</div>
              </td>
            </tr>
          ) : (
            posts.map((p, idx) => (
              <tr key={p.id}>
                <td className="colNo">{total - skip - idx}</td>
                <td className="colTitle">
                  <Link href={`/board/${category}/${p.id}`}>
                    {p.isAdmin && <em className="badgeNew">N</em>}
                    <span className="titleText">{p.title}</span>
                  </Link>
                </td>
                <td className="colAuthor">{p.author ?? '-'}</td>
                <td className="colDate">{formatDate(p.createdAt)}</td>
                <td className="colViews">{p.views}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const GROUP_SIZE = 10
        const groupStart = Math.floor((page - 1) / GROUP_SIZE) * GROUP_SIZE + 1
        const groupEnd = Math.min(groupStart + GROUP_SIZE - 1, totalPages)
        const hasPrev = groupStart > 1
        const hasNext = groupEnd < totalPages

        return (
          <div className="pagination">
            {hasPrev && <Link href={`?page=${groupStart - 1}`}>{'‹'}</Link>}
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map((p) => (
              <Link key={p} href={`?page=${p}`} className={p === page ? 'isActive' : ''}>
                {p}
              </Link>
            ))}
            {hasNext && <Link href={`?page=${groupEnd + 1}`}>{'›'}</Link>}
          </div>
        )
      })()}
    </div>
  )
}
