'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifySliderChanged } from './sliderEvents'

export default function SliderForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [order, setOrder] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function switchMode(next: 'url' | 'file') {
    setMode(next)
    setUrl('')
    setFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      let imageUrl = url
      if (mode === 'file') {
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploaded = await uploadRes.json()
        imageUrl = uploaded.url
      }

      const res = await fetch('/api/slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, alt, title, desc, order: Number(order) }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '등록에 실패했습니다.')
        return
      }

      setUrl('')
      setFile(null)
      setAlt('')
      setTitle('')
      setDesc('')
      setOrder(1)
      router.refresh()
      notifySliderChanged()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === 'url'}
            onChange={() => switchMode('url')}
          />
          URL 등록
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === 'file'}
            onChange={() => switchMode('file')}
          />
          로컬 파일 등록
        </label>
      </div>
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">{mode === 'url' ? '이미지 URL' : '이미지 파일'}</label>
          {mode === 'url' ? (
            <input
              key="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="https://..."
              required
            />
          ) : (
            <div className="flex items-center gap-2">
              <label className="shrink-0 px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">
                파일 선택
                <input
                  key="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  required
                />
              </label>
              <span className="flex-1 min-w-0 truncate text-sm text-gray-500">
                {file ? file.name : '선택된 파일 없음'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">설명(alt)</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder="이미지 설명"
            required
          />
        </div>
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">순서</label>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">제목 (줄바꿈으로 여러 줄 가능)</label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder={'아이들의 들꽃 같은 미소가\n푸른 미래로 자라납니다'}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">설명 문구 (줄바꿈으로 여러 줄 가능)</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder={'1952년부터 이어온 따뜻한 돌봄과 사랑으로...'}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-lg text-sm bg-[#E8863A] text-white hover:bg-[#d4762e] transition-colors disabled:opacity-50"
      >
        {submitting ? '추가 중...' : '추가'}
      </button>
    </form>
  )
}
