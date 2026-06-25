import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '영양소식' }

export default function NutritionPage() {
  return (
    <>
      <PageHeader title="영양소식" breadcrumb={['사업소개', '행정지원', '영양소식']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-[#3D2B1F]/60 text-center py-12">영양 관련 소식을 등록해주세요.</p>
        </div>
      </div>
    </>
  )
}
