import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import HistoryTimeline from '@/components/namsanwon/HistoryTimeline'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import { findBoardContext } from '@/lib/board'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'

export const metadata: Metadata = { title: '연혁' }
export const dynamic = 'force-dynamic'
export const crumbs=['남산원', '연혁'];
const ctx = findBoardContext('history')

export default function HistoryPage() {
  return (
    <>
      <PageBanner
        title="연혁"
        desc="1953년부터 이어온 남산원의 발자취입니다."
        crumbs={crumbs}
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      <div className="boardArea">
        <PageTitle title="연혁" crumbs={crumbs} />
        
        <div className="subContent">
          {/* 연혁 본문은 관리자 > 연혁 관리에서 등록한다. 페이지 관리 블럭은 안내 문구 등 선택 사항. */}
          <PageBlocks page="history" hideWhenEmpty />
          <HistoryTimeline />
        </div>

    </div>
    </>
  )
}
