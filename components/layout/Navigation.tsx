'use client'
import Link from 'next/link'
import { useState, useRef } from 'react'

const NAV_ITEMS = [
  {
    label: '기관소개',
    children: [
      { label: '인사말', href: '/about/greeting' },
      { label: '연혁', href: '/about/history' },
      { label: '현황', href: '/about/status' },
      { label: '시설안내', href: '/about/facility' },
      { label: '오시는 길', href: '/about/directions' },
      { label: '역사사진', href: '/about/photos' },
    ],
  },
  {
    label: '사업소개',
    children: [
      { label: '후원금품현황', href: '/business/admin-support/donation' },
      { label: '영양소식', href: '/business/admin-support/nutrition' },
      { label: '자립지원', href: '/business/independence' },
      { label: '교육지원팀', href: '/business/child-support/education' },
      { label: '보육지원팀', href: '/business/child-support/care' },
    ],
  },
  {
    label: '남산 이야기',
    children: [
      { label: '아동 소식', href: '/story/news' },
      { label: '아동 사진첩', href: '/story/album' },
    ],
  },
  {
    label: '후원/자원봉사',
    children: [
      { label: '후원안내', href: '/support/donation' },
      { label: '자원봉사 안내', href: '/support/volunteer' },
    ],
  },
  {
    label: '게시판',
    children: [
      { label: '공지사항', href: '/board/notice' },
      { label: '채용공고', href: '/board/job' },
      { label: '자유게시판', href: '/board/free' },
      { label: '외국인게시판', href: '/board/foreign' },
      { label: '후원·봉사 갤러리', href: '/board/gallery' },
    ],
  },
  {
    label: '사회복지법인',
    children: [
      { label: '법인게시판', href: '/corporation/board' },
    ],
  },
]

export default function Navigation() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpandIndex, setMobileExpandIndex] = useState<number | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMenuEnter = (idx: number) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpenIndex(idx)
  }

  const handleMenuLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpenIndex(null)
    }, 120)
  }

  return (
    <>
      {/* 데스크탑 네비게이션 */}
      <nav className="hidden md:flex items-center gap-0.5" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="relative"
            onMouseEnter={() => handleMenuEnter(idx)}
            onMouseLeave={handleMenuLeave}
          >
            <button
              aria-label={`${item.label} 메뉴`}
              aria-expanded={openIndex === idx}
              className={`px-3.5 py-2 text-sm font-medium transition-all rounded-lg relative group ${
                openIndex === idx ? 'text-[#3B9EDA]' : 'text-[#1E293B] hover:text-[#3B9EDA]'
              }`}
            >
              {item.label}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#3B9EDA] rounded-full transition-all duration-200 ${
                openIndex === idx ? 'w-4/5' : 'w-0 group-hover:w-4/5'
              }`} />
            </button>
            {openIndex === idx && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-xl rounded-2xl min-w-[150px] z-50 overflow-hidden border border-slate-100"
                role="menu"
              >
                <div className="py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-[#EBF5FF] hover:text-[#3B9EDA] transition-colors"
                      onClick={() => setOpenIndex(null)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B9EDA] opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* 모바일 햄버거 버튼 */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* 모바일 메뉴 패널 */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto" aria-label="모바일 메뉴">
          <div className="px-4 py-4 border-b border-slate-100">
            <Link
              href="/support/donation"
              className="flex items-center justify-center gap-2 bg-[#FF7A59] text-white font-semibold py-3 rounded-full"
              onClick={() => setMobileOpen(false)}
            >
              후원하기
            </Link>
          </div>
          <nav>
            {NAV_ITEMS.map((item, idx) => (
              <div key={idx} className="border-b border-slate-100">
                <button
                  className="w-full flex justify-between items-center px-5 py-4 text-left font-medium text-[#1E293B]"
                  aria-expanded={mobileExpandIndex === idx}
                  onClick={() => setMobileExpandIndex(mobileExpandIndex === idx ? null : idx)}
                >
                  <span>{item.label}</span>
                  <svg
                    className={`w-4 h-4 text-[#3B9EDA] transition-transform duration-200 ${mobileExpandIndex === idx ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileExpandIndex === idx && (
                  <div className="bg-[#EBF5FF] px-4 pb-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-2 px-2 py-2.5 text-sm text-slate-600 hover:text-[#3B9EDA]"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="w-1 h-1 rounded-full bg-[#3B9EDA] flex-shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
