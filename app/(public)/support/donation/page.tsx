import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '후원안내' }

export default function DonationPage() {
  return (
    <>
      <PageBanner
        title="후원안내"
        desc="여러분의 따뜻한 나눔이 아이들의 내일을 밝힙니다."
        crumbs={['후원/자원봉사', '후원안내']}
      />
      <div className="subContent">
        <div className="contentCard">
          <h2>후원 계좌 안내</h2>
          <dl className="infoGrid">
            <div className="infoBox">
              <dt>은행</dt>
              <dd>신한은행</dd>
            </div>
            <div className="infoBox">
              <dt>계좌번호</dt>
              <dd>계좌번호를 입력해주세요</dd>
            </div>
            <div className="infoBox">
              <dt>예금주</dt>
              <dd>사회복지법인 남산원</dd>
            </div>
          </dl>
        </div>
        <div className="contentCard">
          <h2>후원 방법</h2>
          <ul className="stepList">
            <li>
              <span className="stepNo">1</span>
              <span>위 계좌로 후원금을 입금해주세요.</span>
            </li>
            <li>
              <span className="stepNo">2</span>
              <span>전화(02-752-9836)로 후원 의사를 알려주시면 영수증을 발급해드립니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
