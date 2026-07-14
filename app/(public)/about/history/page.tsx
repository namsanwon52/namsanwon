import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '연혁' }
export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  return (
    <>
      <PageBanner
        title="연혁"
        desc="1953년부터 이어온 남산원의 발자취입니다."
        crumbs={['남산원소개', '연혁']}
      />
      <div className="subContent">
        <PageBlocks page="history" />
      </div>
    </>
  )
}
