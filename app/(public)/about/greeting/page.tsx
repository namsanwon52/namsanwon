import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '인사말' }

export default function GreetingPage() {
  return (
    <>
      <PageBanner
        title="인사말"
        desc="남산원을 찾아주신 여러분을 진심으로 환영합니다."
        crumbs={['남산원소개', '인사말']}
      />
      <div className="subContent">
        <div className="contentCard">
          <h2>원장 인사말</h2>
          <p>남산원 홈페이지를 방문해 주신 여러분을 진심으로 환영합니다.</p>
          <p>
            저희 남산원은 1953년 설립 이후 서울 남산 자락에서 아동들의 건강한 성장과 자립을 위해
            헌신해왔습니다. 아이들 한 명 한 명이 밝고 행복하게 성장할 수 있도록 최선을 다하겠습니다.
          </p>
          <p className="signRight">사회복지법인 남산원 원장 드림</p>
        </div>
      </div>
    </>
  )
}
