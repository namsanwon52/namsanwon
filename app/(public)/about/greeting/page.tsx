import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import { findBoardContext } from '@/lib/board'

export const metadata: Metadata = { title: '인사말' }
export const dynamic = 'force-dynamic'
export const crumbs=['남산원', '인사말'];
const ctx = findBoardContext('greeting')

export default function GreetingPage() {
  return (
    <>
      <PageBanner
        title="인사말"
        desc="남산원을 찾아주신 여러분을 진심으로 환영합니다."
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      <div className="boardArea">
        <PageTitle title="인사말" crumbs={crumbs} />

        <div className="subContent">
          <PageBlocks page="greeting" />
        </div>
      </div>
    </>
  )
}
