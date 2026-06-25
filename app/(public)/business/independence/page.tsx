import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '자립지원' }

export default function IndependencePage() {
  return (
    <>
      <PageHeader title="자립지원" breadcrumb={['사업소개', '자립지원']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#E8863A]">자립지원 사업 소개</h2>
            <p className="text-[#3D2B1F]/80">남산원은 아동들이 사회에 자립할 수 있도록 다양한 지원 프로그램을 운영합니다.</p>
            <ul className="list-disc list-inside space-y-2 text-[#3D2B1F]/80">
              <li>자립생활 교육</li>
              <li>직업 탐색 및 체험</li>
              <li>경제교육</li>
              <li>멘토링 프로그램</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
