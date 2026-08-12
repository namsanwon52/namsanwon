import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import { findBoardContext } from '@/lib/board'

export const metadata: Metadata = { title: '현황' }
export const dynamic = 'force-dynamic'
export const crumbs=['남산원', '현황'];
const ctx = findBoardContext('status')


export default function StatusPage() {
  return (
    <>
      <PageBanner
        title="현황"
        desc="남산원의 기관·아동·직원 현황을 안내해 드립니다."
        crumbs={crumbs}
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      
       <div className="boardArea">
          <PageTitle title="현황" crumbs={crumbs} />
          <div className="subContent">
            <PageBlocks page="status" />
          </div>
      </div>
    </>
  )
}
