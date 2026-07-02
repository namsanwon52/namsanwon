import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '자립지원' }

export default function IndependencePage() {
  return (
    <>
      <PageBanner
        title="자립지원"
        desc="아동이 건강한 사회 구성원으로 자립하도록 돕습니다."
        crumbs={['사업소개', '자립지원팀']}
      />
      <div className="subContent">
        <div className="contentCard">
          <h2>자립지원 사업 소개</h2>
          <p>남산원은 아동들이 사회에 자립할 수 있도록 다양한 지원 프로그램을 운영합니다.</p>
          <ul className="bulletList">
            <li>자립생활 교육</li>
            <li>직업 탐색 및 체험</li>
            <li>경제교육</li>
            <li>멘토링 프로그램</li>
          </ul>
        </div>
      </div>
    </>
  )
}
