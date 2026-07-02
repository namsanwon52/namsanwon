import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '보육지원팀' }

export default function CarePage() {
  return (
    <>
      <PageBanner
        title="보육지원팀"
        desc="아이들의 건강한 일상과 돌봄을 책임집니다."
        crumbs={['사업소개', '보육지원팀']}
      />
      <div className="subContent">
        <div className="contentCard">
          <p className="emptyNote">보육지원팀 및 보건소식 내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
