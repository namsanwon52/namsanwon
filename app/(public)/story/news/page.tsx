import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 소식' }
export const revalidate = 600

export default async function StoryNewsPage() {
  const posts = await prisma.post.findMany({
    where: { category: 'free' },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { id: true, title: true, author: true, createdAt: true, views: true },
  })

  return (
    <>
      <PageHeader title="아동 소식" breadcrumb={['남산 이야기', '아동 소식']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FFF8F0] border-b-2 border-[#E8863A]">
              <tr>
                <th className="py-3 px-4 text-left text-[#3D2B1F]">제목</th>
                <th className="py-3 px-4 text-center text-[#3D2B1F] w-24">작성자</th>
                <th className="py-3 px-4 text-center text-[#3D2B1F] w-28">날짜</th>
                <th className="py-3 px-4 text-center text-[#3D2B1F] w-16">조회</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">게시글이 없습니다.</td></tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-[#FFF8F0] transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/board/free/${p.id}`} className="hover:text-[#E8863A]">{p.title}</Link>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500">{p.author}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{p.createdAt.toLocaleDateString('ko-KR')}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{p.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
