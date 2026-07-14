import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BOARD_META } from '@/lib/board'

export default async function AdminDashboard() {
  const counts = await Promise.all(
    Object.keys(BOARD_META).map(async (cat) => ({
      category: cat,
      label: BOARD_META[cat].label,
      count: await prisma.post.count({ where: { code: cat } }),
    }))
  )
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, code: true, title: true, createdAt: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">대시보드</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {counts.map((c) => (
          <Link
            key={c.category}
            href={`/admin/posts?category=${c.category}`}
            className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold text-[#E8863A] mt-1">{c.count}</p>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-[#3D2B1F] mb-3">최근 게시글</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b">
            <tr>
              <th className="pb-2 text-left">게시판</th>
              <th className="pb-2 text-left">제목</th>
              <th className="pb-2 text-right">날짜</th>
            </tr>
          </thead>
          <tbody>
            {recentPosts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 text-gray-500">
                  <Link href={`/admin/posts/${p.id}/edit`} className="block">
                    {BOARD_META[p.code]?.label ?? p.code}
                  </Link>
                </td>
                <td className="py-2">
                  <Link href={`/admin/posts/${p.id}/edit`} className="block">
                    {p.title}
                  </Link>
                </td>
                <td className="py-2 text-right text-gray-400">
                  <Link href={`/admin/posts/${p.id}/edit`} className="block">
                    {p.createdAt.toLocaleDateString('ko-KR')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
