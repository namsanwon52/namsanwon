import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '교육지원팀' }

export default function EducationPage() {
  return (
    <>
      <PageHeader title="교육지원팀" breadcrumb={['사업소개', '아동지원', '교육지원팀']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            {['교육부', '도서부'].map((team) => (
              <div key={team} className="border-l-4 border-[#E8863A] pl-4">
                <h3 className="font-bold text-[#3D2B1F] mb-2">{team}</h3>
                <p className="text-sm text-[#3D2B1F]/60">{team} 활동 내용을 입력해주세요.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
