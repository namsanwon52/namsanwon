import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'
import PageTitle from '@/components/namsanwon/PageTitle'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import { findBoardContext } from '@/lib/board'

export const metadata: Metadata = { title: '시설안내' }
export const dynamic = 'force-dynamic'
export const crumbs=['남산원소개', '시설안내'];
const ctx = findBoardContext('facility')

export default function FacilityPage() {
  return (
    <>
      <PageBanner
        title="시설안내"
        desc="아이들이 생활하고 배우는 남산원의 공간을 소개합니다."
        crumbs={['남산원소개', '시설안내']}
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}
      <div className="boardArea">
        <PageTitle title="시설안내" crumbs={crumbs} />

        <div className="subContent">
          <PageBlocks page="facility" />
        </div>
      </div>
    </>
  )
}
