'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

type SliderImage = { id: number; url: string; alt: string }

export default function ImageSlider({ images }: { images: SliderImage[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (!images.length) return null

  return (
    <div className="relative w-full h-[480px] md:h-[600px] overflow-hidden">
      {/* 슬라이드 이미지 */}
      {images.map((img, idx) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            className="object-cover"
            priority={idx === 0}
          />
          {/* 좌측 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        </div>
      ))}

      {/* 텍스트 오버레이 */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-6xl mx-auto px-6 md:px-8 w-full">
          <div className="max-w-lg">
            <span className="inline-block bg-[#FF7A59]/90 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide">
              사회복지법인 남산원
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-md">
              따뜻한 손길이<br />
              아이들의 미래를<br />
              밝힙니다
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
              1953년부터 아동들의 건강한 성장과<br />
              자립을 위해 함께해 왔습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about/greeting"
                className="bg-white text-[#3B9EDA] font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#EBF5FF] transition-all shadow-md hover:shadow-lg"
              >
                자세히 알아보기
              </Link>
              <Link
                href="/support/donation"
                className="bg-[#FF7A59] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#e8613d] transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                후원하기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 이전 버튼 */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-all border border-white/30"
        aria-label="이전 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-all border border-white/30"
        aria-label="다음 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current ? 'bg-[#FF7A59] w-6 h-2.5' : 'bg-white/50 w-2.5 h-2.5 hover:bg-white/80'
            }`}
            aria-label={`슬라이드 ${idx + 1}로 이동`}
          />
        ))}
      </div>

      {/* 하단 물결 divider */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12 block" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,18 1440,24 L1440,48 L0,48 Z" fill="#FAFAF7" />
        </svg>
      </div>
    </div>
  )
}
