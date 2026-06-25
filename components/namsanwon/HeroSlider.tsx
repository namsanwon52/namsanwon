'use client'

import { useEffect, useRef, useState } from 'react'

const SLIDES = [
  {
    title: ['아이들의 들꽃 같은 미소가', '푸른 미래로 자라납니다'],
    desc: [
      '1952년부터 이어온 따뜻한 돌봄과 사랑으로 아이들의 오늘을 지키고,',
      '희망으로 가득한 내일을 함께 만들어갑니다.',
    ],
  },
  {
    title: ['아이들의 들꽃 같은 미소가', '푸른 미래로 자라납니다'],
    desc: [
      '1952년부터 이어온 따뜻한 돌봄과 사랑으로 아이들의 오늘을 지키고,',
      '희망으로 가득한 내일을 함께 만들어갑니다.',
    ],
  },
]

export default function HeroSlider() {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLoop = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length)
    }, 4000)
  }

  useEffect(() => {
    startLoop()
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const goTo = (i: number) => {
    setActive(i)
    startLoop()
  }

  return (
    <section
      className="heroSection"
      id="about"
      data-hero-slider
      data-hero-active={active}
      aria-label="메인 비주얼"
    >
      <div className={`heroImage heroImage01${active === 0 ? ' isActive' : ''}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="heroBase" src="/namsanwon/hero-figma-01-base.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="heroForeground" src="/namsanwon/hero-figma-01-image.png" alt="" />
      </div>
      <div className={`heroImage heroImage02${active === 1 ? ' isActive' : ''}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="heroBase" src="/namsanwon/hero-figma-02.jpg" alt="" />
      </div>
      <div className="heroDim" aria-hidden="true"></div>

      <div className="heroSlides">
        {SLIDES.map((slide, i) => (
          <div
            className={`heroContent${active === i ? ' isActive' : ''}`}
            key={i}
            aria-hidden={active !== i}
          >
            <h1>
              {slide.title.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < slide.title.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p>
              {slide.desc.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < slide.desc.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="heroPager" aria-label="메인 비주얼 현재 위치">
        {SLIDES.map((_, i) => (
          <button
            type="button"
            key={i}
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
