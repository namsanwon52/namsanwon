import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '시설안내' }

const ROOMS = ['생활실', '교육실', '도서실', '식당', '운동장', '상담실']

export default function FacilityPage() {
  return (
    <>
      <PageBanner
        title="시설안내"
        desc="아이들이 생활하고 배우는 남산원의 공간을 소개합니다."
        crumbs={['남산원소개', '시설안내']}
      />
      <div className="subContent">
        <div className="contentCard">
          <h2>시설 안내</h2>
          <div className="infoGrid">
            {ROOMS.map((room) => (
              <div key={room} className="infoBox">
                <div className="infoLabel">{room}</div>
                <div className="infoValue">시설 설명을 입력해주세요.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
