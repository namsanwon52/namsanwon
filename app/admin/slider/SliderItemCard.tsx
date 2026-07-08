'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { notifySliderChanged } from './sliderEvents'

type SliderImage = {
  id: number
  url: string
  alt: string
  title: string
  desc: string
  order: number
  active: boolean
}

export default function SliderItemCard({ image }: { image: SliderImage }) {
  const router = useRouter()
  const [alt, setAlt] = useState(image.alt)
  const [title, setTitle] = useState(image.title)
  const [desc, setDesc] = useState(image.desc)
  const [order, setOrder] = useState(image.order)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/slider/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt, title, desc, order: Number(order) }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '저장에 실패했습니다.')
      return
    }

    router.refresh()
    notifySliderChanged()
  }

  async function toggleActive() {
    await fetch(`/api/slider/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !image.active }),
    })
    router.refresh()
    notifySliderChanged()
  }

  async function remove() {
    if (!confirm('이 슬라이더 이미지를 삭제하시겠습니까?')) return
    await fetch(`/api/slider/${image.id}`, { method: 'DELETE' })
    router.refresh()
    notifySliderChanged()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
      <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <Image src={image.url} alt={image.alt} fill className="object-cover" unoptimized />
      </div>
      <div className="flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">설명(alt)</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#E8863A]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">순서</label>
            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#E8863A]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목 (줄바꿈으로 여러 줄 가능)</label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#E8863A]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">설명 문구 (줄바꿈으로 여러 줄 가능)</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#E8863A]"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1.5 rounded-full text-xs bg-[#E8863A] text-white hover:bg-[#d4762e] transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={toggleActive}
            className={`px-3 py-1.5 rounded-full text-xs ${
              image.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {image.active ? '활성' : '비활성'}
          </button>
          <button onClick={remove} className="px-3 py-1.5 rounded-full text-xs bg-red-100 text-red-600">
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
