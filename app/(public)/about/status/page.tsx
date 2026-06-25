import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '현황' }

const STATUS_SECTIONS = [
  {
    title: '기관 현황',
    rows: [
      { label: '기관명', value: '사회복지법인 남산원' },
      { label: '설립연도', value: '1953년' },
      { label: '주소', value: '서울시 중구 소파로 2길 31' },
      { label: '정원', value: '아동 00명' },
    ],
  },
  {
    title: '아동 현황',
    rows: [
      { label: '총 아동 수', value: '현재 인원 입력 필요' },
      { label: '남아', value: '-' },
      { label: '여아', value: '-' },
    ],
  },
  {
    title: '직원 현황',
    rows: [
      { label: '총 직원 수', value: '현재 인원 입력 필요' },
      { label: '사회복지사', value: '-' },
      { label: '보육교사', value: '-' },
    ],
  },
]

export default function StatusPage() {
  return (
    <>
      <PageHeader title="현황" breadcrumb={['기관소개', '현황']} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {STATUS_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-white bg-[#E8863A] px-6 py-3">{section.title}</h2>
            <table className="w-full text-sm">
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F0]'}>
                    <th className="py-3 px-6 text-left text-[#3D2B1F] font-medium w-32 border-r border-gray-100">{row.label}</th>
                    <td className="py-3 px-6 text-[#3D2B1F]/80">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  )
}
