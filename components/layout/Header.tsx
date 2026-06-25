'use client'
import Link from 'next/link'
import Navigation from './Navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md'
          : 'bg-white shadow-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-18 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#3B9EDA] flex items-center justify-center shadow-sm group-hover:bg-[#1a6fa8] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3 5.5V16h6v-2.5c1.5-1 3-3 3-5.5 0-3.5-2.5-6-6-6z" fill="white" opacity="0.9"/>
              <path d="M9 16v2a1 1 0 001 1h4a1 1 0 001-1v-2H9z" fill="white"/>
              <path d="M10 10c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z" fill="#3B9EDA"/>
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">Social Welfare</span>
            <span className="text-lg font-bold text-[#1E293B] tracking-tight">남산원</span>
          </div>
        </Link>
        <Navigation />
        <Link
          href="/support/donation"
          className="hidden md:flex items-center gap-1.5 bg-[#FF7A59] hover:bg-[#e8613d] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
          </svg>
          후원하기
        </Link>
      </div>
    </header>
  )
}
