import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import { findBoardContext } from '@/lib/board'

export const metadata: Metadata = { title: '후원안내' }
export const dynamic = 'force-dynamic'
const crumbs = ['후원/자원봉사', '후원신청 안내']
const ctx = findBoardContext('donation')

export default function DonationPage() {
  return (
    <>
      <PageBanner
        title="후원안내"
        desc="여러분의 따뜻한 나눔이 아이들의 내일을 밝힙니다."
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      <div className="boardArea">
        <PageTitle title="후원신청 안내" crumbs={crumbs} />

        <div className="subContent">
          <PageBlocks page="donation" />
        </div>
      </div>
    </>
  )
}
