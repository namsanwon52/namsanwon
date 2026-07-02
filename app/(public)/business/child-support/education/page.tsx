import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '교육지원팀' }

const TEAMS = ['교육부', '도서부']

export default function EducationPage() {
  return (
    <>
      <PageBanner
        title="교육지원팀"
        desc="배움을 통해 아이들의 꿈을 키워갑니다."
        crumbs={['사업소개', '교육지원팀']}
      />
      <div className="subContent">
        <div className="contentCard">
          <div className="infoGrid">
            {TEAMS.map((team) => (
              <div key={team} className="infoBox">
                <div className="infoLabel">{team}</div>
                <div className="infoValue">{team} 활동 내용을 입력해주세요.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
