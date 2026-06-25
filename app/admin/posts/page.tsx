import { prisma } from '@/lib/prisma'
import { BOARD_META } from '@/lib/board'
import Link from 'next/link'
import PostActions from './PostActions'

type Props = { searchParams: Promise<{ category?: string; page?: string }> }

export default async function AdminPostsPage({ searchParams }: Props) {
  const { category: rawCategory, page: rawPage } = await searchParams
  const category = rawCategory ?? 'notice'
  const page = Number(rawPage ?? '1')
  const limit = 20
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, author: true, createdAt: true, views: true },
    }),
    prisma.post.count({ where: { category } }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3D2B1F]">게시글 관리</h1>
        <Link
          href={`/admin/posts/write?category=${category}`}
          className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e]"
        >
          글쓰기
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(BOARD_META).map(([cat, meta]) => (
          <Link
            key={cat}
            href={`/admin/posts?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm ${
              cat === category ? 'bg-[#E8863A] text-white' : 'bg-white border text-gray-600 hover:border-[#E8863A]'
            }`}
          >
            {meta.label}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-left">제목</th>
              <th className="py-3 px-4 text-center w-24">작성자</th>
              <th className="py-3 px-4 text-center w-28">날짜</th>
              <th className="py-3 px-4 text-center w-20">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{p.title}</td>
                <td className="py-3 px-4 text-center text-gray-500">{p.author}</td>
                <td className="py-3 px-4 text-center text-gray-400">
                  {p.createdAt.toLocaleDateString('ko-KR')}
                </td>
                <td className="py-3 px-4 text-center">
                  <PostActions id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-400">총 {total}개</p>
    </div>
  )
}
