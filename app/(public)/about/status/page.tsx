import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import DbPageContent from '@/components/namsanwon/DbPageContent'

export const metadata: Metadata = { title: '현황' }
export const dynamic = 'force-dynamic'

export default function StatusPage() {
  return (
    <>
      <PageBanner
        title="현황"
        desc="남산원의 기관·아동·직원 현황을 안내해 드립니다."
        crumbs={['남산원소개', '현황']}
      />
      <div className="subContent">
        <DbPageContent slug="status" />
      </div>
    </>
  )
}
