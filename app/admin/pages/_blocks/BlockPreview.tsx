'use client'
import { useEffect, useState } from 'react'
import { BLOCK_CHANGED_EVENT } from './blockEvents'

export default function BlockPreview({ path }: { path: string }) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener(BLOCK_CHANGED_EVENT, handler)
    return () => window.removeEventListener(BLOCK_CHANGED_EVENT, handler)
  }, [])

  return (
    <iframe
      key={`${path}-${version}`}
      src={path}
      title="공개 페이지 미리보기"
      className="w-full h-[720px] border-0"
    />
  )
}
