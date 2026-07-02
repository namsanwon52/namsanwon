import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '오시는 길' }

const INFO = [
  { label: '주소', value: '서울시 중구 소파로 2길 31 (우) 04628' },
  { label: '전화', value: '02-752-9836' },
  { label: '팩스', value: '02-755-9836' },
  { label: '대중교통', value: '교통 정보를 입력해주세요.' },
]

export default function DirectionsPage() {
  return (
    <>
      <PageBanner
        title="오시는 길"
        desc="남산원을 찾아오시는 방법을 안내해 드립니다."
        crumbs={['남산원소개', '오시는 길']}
      />
      <div className="subContent">
        <div className="contentCard">
          <div className="mapBox">지도 영역 (카카오맵 API 키 설정 후 연동)</div>
          <dl className="infoGrid">
            {INFO.map((item) => (
              <div key={item.label} className="infoBox">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  )
}
