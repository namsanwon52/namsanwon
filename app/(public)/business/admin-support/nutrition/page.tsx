import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '영양소식' }

export default function NutritionPage() {
  return (
    <>
      <PageBanner
        title="영양소식"
        desc="아이들의 건강한 식생활을 위한 영양 정보입니다."
        crumbs={['사업소개', '행정지원팀', '영양소식']}
      />
      <div className="subContent">
        <div className="contentCard">
          <p className="emptyNote">영양 관련 소식을 등록해주세요.</p>
        </div>
      </div>
    </>
  )
}
