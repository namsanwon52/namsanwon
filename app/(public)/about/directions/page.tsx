import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '오시는 길' }
export const dynamic = 'force-dynamic'

export default function DirectionsPage() {
  return (
    <>
      <PageBanner
        title="오시는 길"
        desc="남산원을 찾아오시는 방법을 안내해 드립니다."
        crumbs={['남산원소개', '오시는 길']}
      />
      <div className="subContent">
        <PageBlocks page="directions" />
      </div>
    </>
  )
}
