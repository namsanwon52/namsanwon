import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: '후원금품현황' }
export const revalidate = 3600

export default async function DonationStatusPage() {
  const records = await prisma.donationRecord.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 24,
  })

  return (
    <>
      <PageHeader title="후원금품현황" breadcrumb={['사업소개', '행정지원', '후원금품현황']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {records.length === 0 ? (
            <p className="text-center py-12 text-[#3D2B1F]/60">등록된 현황이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#E8863A] text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-20">연도</th>
                  <th className="py-3 px-4 text-center w-16">월</th>
                  <th className="py-3 px-4 text-left">내용</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-[#FFF8F0]">
                    <td className="py-3 px-4 text-center">{r.year}</td>
                    <td className="py-3 px-4 text-center">{r.month}월</td>
                    <td className="py-3 px-4 text-[#3D2B1F]/80">{r.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
