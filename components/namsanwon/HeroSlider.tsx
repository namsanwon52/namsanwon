'use client'

import { useEffect, useRef, useState } from 'react'

export type HeroSlide = {
  id: number
  url: string
  alt: string
  title: string | null
  desc: string | null
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLoop = () => {
    if (timer.current) clearInterval(timer.current)
    if (slides.length <= 1) return
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % slides.length)
    }, 4000)
  }

  useEffect(() => {
    startLoop()
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [slides.length])

  const goTo = (i: number) => {
    setActive(i)
    startLoop()
  }

  if (slides.length === 0) return null

  return (
    <section
      className="heroSection"
      id="about"
      data-hero-slider
      data-hero-active={active}
      aria-label="메인 비주얼"
    >
      {slides.map((slide, i) => (
        <div key={slide.id} className={`heroImage${active === i ? ' isActive' : ''}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="heroBase" src={slide.url} alt={slide.alt} />
        </div>
      ))}
      <div className="heroDim" aria-hidden="true"></div>

      <div className="heroSlides">
        {slides.map((slide, i) => (
          <div
            className={`heroContent${active === i ? ' isActive' : ''}`}
            key={slide.id}
            aria-hidden={active !== i}
          >
            <h1>
              {(slide.title ?? '').split('\n').map((line, idx, arr) => (
                <span key={idx}>
                  {line}
                  {idx < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p>
              {(slide.desc ?? '').split('\n').map((line, idx, arr) => (
                <span key={idx}>
                  {line}
                  {idx < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="heroPager" aria-label="메인 비주얼 현재 위치">
        {slides.map((slide, i) => (
          <button
            type="button"
            key={slide.id}
            className={active === i ? 'isActive' : ''}
            aria-label={`메인 비주얼 ${i + 1}번 보기`}
            aria-current={active === i ? 'true' : 'false'}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  )
}
