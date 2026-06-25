import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '연혁' }

const HISTORY = [
  { year: '1953', events: ['남산원 설립'] },
  { year: '1960', events: ['보육시설 인가'] },
  { year: '1970', events: ['아동복지시설 등록'] },
  { year: '1980', events: ['사회복지법인 인가'] },
  { year: '1990', events: ['자립지원 프로그램 시작'] },
  { year: '2000', events: ['홈페이지 개설', '교육지원팀 신설'] },
  { year: '2010', events: ['보육지원팀 신설', '시설 증축'] },
  { year: '2020', events: ['남산원 리모델링 시작'] },
  { year: '2024', events: ['신관 완공'] },
]

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="연혁" breadcrumb={['기관소개', '연혁']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="relative border-l-4 border-[#E8863A] pl-8 space-y-8">
          {HISTORY.map((item) => (
            <div key={item.year} className="relative">
              <div className="absolute -left-[2.65rem] w-5 h-5 bg-[#E8863A] rounded-full border-4 border-white shadow" />
              <h3 className="text-xl font-bold text-[#E8863A] mb-1">{item.year}</h3>
              <ul className="space-y-1">
                {item.events.map((e) => (
                  <li key={e} className="text-[#3D2B1F]/80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E8863A] rounded-full inline-block flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
