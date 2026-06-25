'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MENU } from './menu'

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [sitemapOpen, setSitemapOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

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
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenItem(null)
        setSitemapOpen(false)
        setMobileNavOpen(false)
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
          <img className="logoImg" src="/logo.jpg" alt="남산원" />
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
            <Link href="/admin/login" onClick={closeAll}>로그인</Link>
          </div>
        </nav>

        <div className="utilityNav" aria-label="회원 메뉴">
          <Link href="/admin/login">로그인</Link>
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
