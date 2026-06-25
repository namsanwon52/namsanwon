import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '남산원 역사사진' }

export default function PhotosPage() {
  return (
    <>
      <PageHeader title="남산원 역사사진" breadcrumb={['기관소개', '역사사진']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-[#3D2B1F]/60 text-center py-12">역사사진을 준비 중입니다.</p>
        </div>
      </div>
    </>
  )
}
