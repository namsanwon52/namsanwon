import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import { findBoardContext } from '@/lib/board'

export const metadata: Metadata = { title: '자원봉사 안내' }
export const dynamic = 'force-dynamic'
const crumbs = ['후원/자원봉사', '자원봉사신청 안내']
const ctx = findBoardContext('volunteer')

export default function VolunteerPage() {
  return (
    <>
      <PageBanner
        title="자원봉사 안내"
        desc="아이들과 함께하는 소중한 시간에 여러분을 초대합니다."
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      <div className="boardArea">
        <PageTitle title="자원봉사신청 안내" crumbs={crumbs} />

        <div className="subContent">
          <PageBlocks page="volunteer" />
        </div>
      </div>
    </>
  )
}
