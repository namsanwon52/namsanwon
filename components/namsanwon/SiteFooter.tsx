import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="footer" id="footer">
      <div className="footerInner">
        <Link className="footerLogo" href="/" aria-label="남산원 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="footerLogoImg" src="/logo-namsanwon.svg" alt="사회복지법인 아동복지시설 남산원" />
        </Link>
        <div className="footerInfo">
          <p><b>주소:</b> (우)04628 서울시 중구 소파로 2길 31</p>
          <p><b>전화:</b> 02-752-9836 <b>팩스:</b> 02-755-9836 <b>원장:</b> 박흥식</p>
          <p><b>이메일:</b> namsanwon@daum.net</p>
          <p>Copyright © 사회복지법인 남산원 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
