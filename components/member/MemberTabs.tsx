'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: '회원가입', href: '/member/join' },
  { label: '로그인', href: '/member/login' },
  { label: '아이디/비밀번호 찾기', href: '/member/find-account' },
]

export default function MemberTabs() {
  const pathname = usePathname()

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
