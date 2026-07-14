import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '자원봉사 안내' }
export const dynamic = 'force-dynamic'

export default function VolunteerPage() {
  return (
    <>
      <PageBanner
        title="자원봉사 안내"
        desc="아이들과 함께하는 소중한 시간에 여러분을 초대합니다."
        crumbs={['후원/자원봉사', '자원봉사 안내']}
      />
      <div className="subContent">
        <PageBlocks page="volunteer" />
      </div>
    </>
  )
}
