import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '시설안내' }
export const dynamic = 'force-dynamic'

export default function FacilityPage() {
  return (
    <>
      <PageBanner
        title="시설안내"
        desc="아이들이 생활하고 배우는 남산원의 공간을 소개합니다."
        crumbs={['남산원소개', '시설안내']}
      />
      <div className="subContent">
        <PageBlocks page="facility" />
      </div>
    </>
  )
}
