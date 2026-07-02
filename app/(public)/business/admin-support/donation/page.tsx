import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
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
      <PageBanner
        title="후원금품현황"
        desc="투명하게 공개하는 남산원의 후원금품 현황입니다."
        crumbs={['사업소개', '행정지원팀', '후원금품현황']}
      />
      <div className="subContent">
        {records.length === 0 ? (
          <div className="contentCard">
            <p className="emptyNote">등록된 현황이 없습니다.</p>
          </div>
        ) : (
          <table className="boardTable">
            <thead>
              <tr>
                <th className="colNo">연도</th>
                <th className="colNo">월</th>
                <th className="colTitle">내용</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="colNo">{r.year}</td>
                  <td className="colNo">{r.month}월</td>
                  <td className="colTitle">{r.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
