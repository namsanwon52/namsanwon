'use client'
import { useEffect, useState } from 'react'
import { SLIDER_CHANGED_EVENT } from './sliderEvents'

export default function SliderPreview() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener(SLIDER_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SLIDER_CHANGED_EVENT, handler)
  }, [])

  return (
    <iframe
      key={version}
      src="/hero-preview"
      title="메인 홈페이지 슬라이더 미리보기"
      className="w-full h-[480px] md:h-[600px] border-0"
    />
  )
}
