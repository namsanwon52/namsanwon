import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import DbPageContent from '@/components/namsanwon/DbPageContent'

export const metadata: Metadata = { title: '인사말' }
export const dynamic = 'force-dynamic'

export default function GreetingPage() {
  return (
    <>
      <PageBanner
        title="인사말"
        desc="남산원을 찾아주신 여러분을 진심으로 환영합니다."
        crumbs={['남산원소개', '인사말']}
      />
      <div className="subContent">
        <DbPageContent slug="greeting" />
      </div>
    </>
  )
}
