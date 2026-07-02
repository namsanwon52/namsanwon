import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

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
      <PageBanner
        title="연혁"
        desc="1953년부터 이어온 남산원의 발자취입니다."
        crumbs={['남산원소개', '연혁']}
      />
      <div className="subContent">
        <div className="contentCard">
          <ul className="timeline">
            {HISTORY.map((item) => (
              <li key={item.year}>
                <p className="tlYear">{item.year}</p>
                <ul className="tlEvents">
                  {item.events.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
