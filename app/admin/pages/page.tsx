import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MANAGED_PAGES } from '@/lib/managed-pages'

export default async function AdminPagesList() {
  const rows = await prisma.contentBlock.groupBy({
    by: ['page'],
    _max: { updatedAt: true },
  })
  const updatedByPage = new Map(rows.map((r) => [r.page, r._max.updatedAt]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3D2B1F]">페이지 관리</h1>
        <p className="text-sm text-gray-500 mt-1">남산원소개 하위 소개 페이지 및 후원/자원봉사 안내 페이지의 내용을 편집합니다.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b bg-gray-50">
            <tr>
              <th className="p-3 text-left">페이지</th>
              <th className="p-3 text-left">공개 주소</th>
              <th className="p-3 text-right">최근 수정</th>
              <th className="p-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {MANAGED_PAGES.map((p) => (
              <tr key={p.slug} className="border-b last:border-0">
                <td className="p-3 font-medium text-[#3D2B1F]">
                  <span className="text-gray-400 font-normal">{p.parent}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  {p.title}
                </td>
                <td className="p-3 text-gray-500">
                  <Link href={p.publicPath} target="_blank" className="hover:underline">
                    {p.publicPath}
                  </Link>
                </td>
                <td className="p-3 text-right text-gray-400">
                  {updatedByPage.get(p.slug)?.toLocaleDateString('ko-KR') ?? '-'}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/pages/${p.slug}`}
                    className="inline-block px-3 py-1.5 text-xs bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e]"
                  >
                    편집
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
