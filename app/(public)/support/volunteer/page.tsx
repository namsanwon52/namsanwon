import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '자원봉사 안내' }

export default function VolunteerPage() {
  return (
    <>
      <PageBanner
        title="자원봉사 안내"
        desc="아이들과 함께하는 소중한 시간에 여러분을 초대합니다."
        crumbs={['후원/자원봉사', '자원봉사 안내']}
      />
      <div className="subContent">
        <div className="contentCard">
          <h2>자원봉사 신청 안내</h2>
          <p>자원봉사에 관심 있으신 분들은 아래 연락처로 문의해 주세요.</p>
          <dl className="infoGrid">
            <div className="infoBox">
              <dt>문의</dt>
              <dd>02-752-9836</dd>
            </div>
            <div className="infoBox">
              <dt>이메일</dt>
              <dd>namsanwon@namsanwon.or.kr</dd>
            </div>
          </dl>
        </div>
        <div className="contentCard">
          <h2>봉사 활동 내용</h2>
          <ul className="bulletList">
            <li>아동 학습 지도</li>
            <li>급식 지원</li>
            <li>시설 환경 개선</li>
            <li>문화·체험 활동 지원</li>
          </ul>
        </div>
      </div>
    </>
  )
}
