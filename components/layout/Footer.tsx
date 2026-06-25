import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16">
      {/* 물결형 divider */}
      <div className="overflow-hidden leading-none bg-[#FAFAF7]">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 block" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="#0F172A" />
        </svg>
      </div>

      <div className="bg-[#0F172A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* 로고 & 소개 */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#3B9EDA] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3 5.5V16h6v-2.5c1.5-1 3-3 3-5.5 0-3.5-2.5-6-6-6z" fill="white" opacity="0.9"/>
                    <path d="M9 16v2a1 1 0 001 1h4a1 1 0 001-1v-2H9z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase">Social Welfare</p>
                  <p className="font-bold text-white text-base leading-tight">남산원</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                1953년 설립 이후 서울 남산 자락에서<br />
                아동들의 건강한 성장과 자립을<br />
                지원해온 사회복지기관입니다.
              </p>
            </div>

            {/* 연락처 */}
            <div>
              <h3 className="text-sm font-semibold text-[#3B9EDA] uppercase tracking-wider mb-4">Contact</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-[#3B9EDA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  서울시 중구 소파로 2길 31<br />(우) 04628
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#3B9EDA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  02-752-9836
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#3B9EDA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  www.namsanwon.or.kr
                </li>
              </ul>
            </div>

            {/* 바로가기 */}
            <div>
              <h3 className="text-sm font-semibold text-[#3B9EDA] uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { label: '기관소개', href: '/about/greeting' },
                  { label: '후원안내', href: '/support/donation' },
                  { label: '자원봉사', href: '/support/volunteer' },
                  { label: '공지사항', href: '/board/notice' },
                  { label: '오시는 길', href: '/about/directions' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-[#3B9EDA] transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#3B9EDA]" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} 사회복지법인 남산원. All rights reserved.
            </p>
            <Link
              href="/support/donation"
              className="text-xs text-[#FF7A59] hover:text-white transition-colors font-medium"
            >
              후원하기 →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
