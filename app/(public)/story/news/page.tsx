import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 소식' }
export const revalidate = 600

function formatDate(d: Date) {
  return d.toLocaleDateString('ko-KR').replace(/\.$/, '')
}

export default async function StoryNewsPage() {
  const posts = await prisma.post.findMany({
    where: { code: 'liv1' },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { id: true, title: true, author: true, createdAt: true, views: true },
  })

  return (
    <>
      <PageBanner
        title="아동 소식"
        desc="남산원 아이들의 건강하고 행복한 일상을 전해 드립니다."
        crumbs={['남산 이야기', '아동 소식']}
      />
      <div className="subContent">
        <table className="boardTable">
          <thead>
            <tr>
              <th className="colTitle">제목</th>
              <th className="colAuthor">작성자</th>
              <th className="colDate">작성일</th>
              <th className="colViews">조회</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="boardEmpty">등록된 게시글이 없습니다.</div>
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id}>
                  <td className="colTitle">
                    <Link href={`/board/liv1/${p.id}`}>
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
      </div>
    </>
  )
}
