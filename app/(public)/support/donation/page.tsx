import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '후원안내' }
export const dynamic = 'force-dynamic'

export default function DonationPage() {
  return (
    <>
      <PageBanner
        title="후원안내"
        desc="여러분의 따뜻한 나눔이 아이들의 내일을 밝힙니다."
        crumbs={['후원/자원봉사', '후원안내']}
      />
      <div className="subContent">
        <PageBlocks page="donation" />
      </div>
    </>
  )
}
