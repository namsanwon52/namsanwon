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
          <p>Copyright © 사회복지법인 남산원 All Rights Reserved.</p>
        </div>
        <a
          className="footerSns"
          href="https://www.facebook.com/namsanwon"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="남산원 페이스북"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
