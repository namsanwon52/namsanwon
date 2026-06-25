import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '오시는 길' }

export default function DirectionsPage() {
  return (
    <>
      <PageHeader title="오시는 길" breadcrumb={['기관소개', '오시는 길']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="w-full h-72 bg-gray-100 rounded-lg mb-6 flex items-center justify-center text-gray-400 text-sm">
            지도 영역 (카카오맵 API 키 설정 후 연동)
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <dt className="font-bold text-[#E8863A] mb-1">주소</dt>
              <dd className="text-[#3D2B1F]/80">서울시 중구 소파로 2길 31 (우) 04628</dd>
            </div>
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <dt className="font-bold text-[#E8863A] mb-1">전화</dt>
              <dd className="text-[#3D2B1F]/80">02-752-9836</dd>
            </div>
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <dt className="font-bold text-[#E8863A] mb-1">팩스</dt>
              <dd className="text-[#3D2B1F]/80">02-755-9836</dd>
            </div>
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <dt className="font-bold text-[#E8863A] mb-1">대중교통</dt>
              <dd className="text-[#3D2B1F]/80">교통 정보를 입력해주세요.</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  )
}
