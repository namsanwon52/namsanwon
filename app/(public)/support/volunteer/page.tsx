import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '자원봉사 안내' }

export default function VolunteerPage() {
  return (
    <>
      <PageHeader title="자원봉사 안내" breadcrumb={['후원/자원봉사', '자원봉사 안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">자원봉사 신청 안내</h2>
          <div className="space-y-4 text-[#3D2B1F]/80 text-sm">
            <p>자원봉사에 관심 있으신 분들은 아래 연락처로 문의해 주세요.</p>
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <p><strong>문의:</strong> 02-752-9836</p>
              <p><strong>이메일:</strong> namsanwon@namsanwon.or.kr</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">봉사 활동 내용</h2>
          <ul className="list-disc list-inside space-y-2 text-[#3D2B1F]/80 text-sm">
            <li>아동 학습 지도</li>
            <li>급식 지원</li>
            <li>시설 환경 개선</li>
            <li>문화·체험 활동 지원</li>
          </ul>
        </div>
      </div>
    </>
  )
}
