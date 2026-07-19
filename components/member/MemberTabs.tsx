'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LOGGED_OUT_TABS = [
  { label: '회원가입', href: '/member/join' },
  { label: '로그인', href: '/member/login' },
  { label: '아이디/비밀번호 찾기', href: '/member/find-account' },
]

const LOGGED_IN_TABS = [
  { label: '개인정보변경', href: '/member/mypage' },
  { label: '비밀번호 변경', href: '/member/change-password' },
]

export default function MemberTabs() {
  const pathname = usePathname()
  const isLoggedInSection = LOGGED_IN_TABS.some((tab) => pathname.startsWith(tab.href))
  const TABS = isLoggedInSection ? LOGGED_IN_TABS : LOGGED_OUT_TABS

  return (
    <nav className="memberTopNav" aria-label="회원 메뉴">
      <div className="memberTopNavInner">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={pathname.startsWith(tab.href) ? 'isActive' : ''}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
