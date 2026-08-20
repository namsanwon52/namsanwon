import { prisma } from '@/lib/prisma'
import HistoryForm from './HistoryForm'
import HistoryRow from './HistoryRow'

export const dynamic = 'force-dynamic'

export default async function AdminHistoryPage() {
  const entries = await prisma.historyEntry.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { order: 'asc' }, { id: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1b1c1c]">연혁 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          남산원소개 &gt; 연혁 페이지의 타임라인입니다. 총 {entries.length}건
        </p>
      </div>

      <HistoryForm />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-500">
              <th className="py-3 px-4 text-center w-16">번호</th>
              <th className="py-3 px-4 text-center w-20">연도</th>
              <th className="py-3 px-4 text-center w-28">월/일</th>
              <th className="py-3 px-4 text-left">내용</th>
              <th className="py-3 px-4 text-center w-40">관리</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400">
                  등록된 연혁이 없습니다. 위에서 새 연혁을 추가해 주세요.
                </td>
              </tr>
            )}
            {entries.map((entry, i) => (
              <HistoryRow key={entry.id} entry={entry} no={entries.length - i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
