import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '인사말' }

export default function GreetingPage() {
  return (
    <>
      <PageHeader title="인사말" breadcrumb={['기관소개', '인사말']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-[#E8863A] mb-6">원장 인사말</h2>
          <div className="text-[#3D2B1F]/80 leading-relaxed space-y-4">
            <p>남산원 홈페이지를 방문해 주신 여러분을 진심으로 환영합니다.</p>
            <p>저희 남산원은 1953년 설립 이후 서울 남산 자락에서 아동들의 건강한 성장과 자립을 위해 헌신해왔습니다. 아이들 한 명 한 명이 밝고 행복하게 성장할 수 있도록 최선을 다하겠습니다.</p>
            <p className="font-medium mt-8 text-right">사회복지법인 남산원 원장 드림</p>
          </div>
        </div>
      </div>
    </>
  )
}
