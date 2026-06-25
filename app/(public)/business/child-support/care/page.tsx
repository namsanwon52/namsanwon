import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '보육지원팀' }

export default function CarePage() {
  return (
    <>
      <PageHeader title="보육지원팀" breadcrumb={['사업소개', '아동지원', '보육지원팀']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-[#3D2B1F]/60 text-center py-12">보육지원팀 및 보건소식 내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
