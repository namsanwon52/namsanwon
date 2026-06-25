import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '후원안내' }

export default function DonationPage() {
  return (
    <>
      <PageHeader title="후원안내" breadcrumb={['후원/자원봉사', '후원안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">후원 계좌 안내</h2>
          <div className="bg-[#FFF8F0] rounded-lg p-5 space-y-2 text-sm">
            <p><strong className="text-[#3D2B1F]">은행:</strong> <span className="text-[#3D2B1F]/80">신한은행</span></p>
            <p><strong className="text-[#3D2B1F]">계좌번호:</strong> <span className="text-[#3D2B1F]/80">계좌번호를 입력해주세요</span></p>
            <p><strong className="text-[#3D2B1F]">예금주:</strong> <span className="text-[#3D2B1F]/80">사회복지법인 남산원</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">후원 방법</h2>
          <ul className="space-y-3 text-[#3D2B1F]/80 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#E8863A] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
              <span>위 계좌로 후원금을 입금해주세요.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#E8863A] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
              <span>전화(02-752-9836)로 후원 의사를 알려주시면 영수증을 발급해드립니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
