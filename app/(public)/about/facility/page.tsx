import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '시설안내' }

export default function FacilityPage() {
  return (
    <>
      <PageHeader title="시설안내" breadcrumb={['기관소개', '시설안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-6">시설 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['생활실', '교육실', '도서실', '식당', '운동장', '상담실'].map((room) => (
              <div key={room} className="bg-[#FFF8F0] rounded-lg p-4 border border-[#E8863A]/20">
                <h3 className="font-medium text-[#3D2B1F]">{room}</h3>
                <p className="text-sm text-[#3D2B1F]/60 mt-1">시설 설명을 입력해주세요.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
