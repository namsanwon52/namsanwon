'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MENU } from './menu'

type Member = { id: string; name: string }

export default function SiteHeader({ member }: { member: Member | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [sitemapOpen, setSitemapOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const router = useRouter()

  // 스크롤 시 헤더 스타일
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 외부 클릭 / ESC 로 닫기
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenItem(null)
        setSitemapOpen(false)
        setUserMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenItem(null)
        setSitemapOpen(false)
        setMobileNavOpen(false)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const closeAll = () => {
    setMobileNavOpen(false)
    setOpenItem(null)
    setSitemapOpen(false)
    setUserMenuOpen(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/member/logout', { method: 'POST' })
      closeAll()
      router.push('/')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header
      ref={headerRef}
      className={`globalNav${scrolled ? ' isScrolled' : ''}${sitemapOpen ? ' isSitemapOpen' : ''}`}
      data-header
    >
      <div className="globalNavInner">
        <Link className="logo" href="/" aria-label="남산원 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logoImg" src="/logo-namsanwon.svg" alt="사회복지법인 아동복지시설 남산원" />
        </Link>

        <button
          className="menuButton"
          type="button"
          aria-controls="primaryNav"
          aria-expanded={mobileNavOpen}
          onClick={() => {
            setMobileNavOpen((v) => !v)
            setSitemapOpen(false)
          }}
        >
          <span></span>
          <span></span>
          <span></span>
          <span className="blind">메뉴 열기</span>
        </button>

        <nav
          className={`primaryNav${mobileNavOpen ? ' isOpen' : ''}`}
          id="primaryNav"
          aria-label="주요 메뉴"
        >
          {MENU.map((group, i) => (
            <div className={`navItem${openItem === i ? ' isOpen' : ''}`} key={group.label}>
              <button
                className="navTrigger"
                type="button"
                aria-expanded={openItem === i}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenItem((cur) => (cur === i ? null : i))
                  setSitemapOpen(false)
                }}
              >
                {group.label}
              </button>
              <div className="subMenu">
                {group.items.map((item) => (
                  <Link href={item.href} key={item.href} onClick={closeAll}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="mobileUtilityNav" aria-label="회원 메뉴">
            {member ? (
              <>
                <div className={`userMenu${userMenuOpen ? ' isOpen' : ''}`}>
                  <button
                    className="userMenuTrigger"
                    type="button"
                    aria-expanded={userMenuOpen}
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserMenuOpen((v) => !v)
                      setOpenItem(null)
                      setSitemapOpen(false)
                    }}
                  >
                    {member.name}님
                  </button>
                  <div className="userMenuDropdown">
                    <Link href="/member/mypage" onClick={closeAll}>개인정보변경</Link>
                    <Link href="/member/change-password" onClick={closeAll}>비밀번호 변경</Link>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} disabled={loggingOut}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/member/login" onClick={closeAll}>로그인</Link>
                <Link href="/member/join" onClick={closeAll}>회원가입</Link>
              </>
            )}
          </div>
        </nav>

        <div className="utilityNav" aria-label="회원 메뉴">
          {member ? (
            <>
              <div className={`userMenu${userMenuOpen ? ' isOpen' : ''}`}>
                <button
                  className="userMenuTrigger"
                  type="button"
                  aria-expanded={userMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation()
                    setUserMenuOpen((v) => !v)
                    setOpenItem(null)
                    setSitemapOpen(false)
                  }}
                >
                  {member.name}님
                </button>
                <div className="userMenuDropdown">
                  <Link href="/member/mypage" onClick={closeAll}>개인정보변경</Link>
                  <Link href="/member/change-password" onClick={closeAll}>비밀번호 변경</Link>
                </div>
              </div>
              <button type="button" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </>
          ) : (
            <>
              <Link href="/member/login">로그인</Link>
              <Link href="/member/join">회원가입</Link>
            </>
          )}
        </div>

        <button
          className="sitemapButton"
          type="button"
          aria-controls="sitemapDropdown"
          aria-expanded={sitemapOpen}
          aria-label={sitemapOpen ? '사이트맵 닫기' : '사이트맵 열기'}
          onClick={(e) => {
            e.stopPropagation()
            setSitemapOpen((v) => !v)
            setOpenItem(null)
            setMobileNavOpen(false)
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`sitemapDropdown${sitemapOpen ? ' isOpen' : ''}`} id="sitemapDropdown">
        <div className="sitemapDropdownInner" aria-label="전체 메뉴">
          {MENU.map((group) => (
            <section className="sitemapGroup" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link href={item.href} key={item.href} onClick={closeAll}>
                  {item.label}
                </Link>
              ))}
            </section>
          ))}
        </div>
      </div>
    </header>
  )
}
