import { prisma } from '@/lib/prisma'
import DonationForm from './DonationForm'

export default async function AdminDonationPage() {
  const records = await prisma.donationRecord.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">후원금품현황 관리</h1>
      <DonationForm />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-center w-20">연도</th>
              <th className="py-3 px-4 text-center w-16">월</th>
              <th className="py-3 px-4 text-left">내용</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-3 px-4 text-center">{r.year}</td>
                <td className="py-3 px-4 text-center">{r.month}월</td>
                <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{r.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
