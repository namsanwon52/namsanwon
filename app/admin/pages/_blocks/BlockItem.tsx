'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { notifyBlockChanged } from './blockEvents'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

type ContentBlockData = {
  id: number
  page: string
  type: string
  title: string
  content: string
  imageUrl: string
  imageAlt: string
  order: number
  active: boolean
}

export default function BlockItem({
  block,
  prev,
  next,
}: {
  block: ContentBlockData
  prev?: { id: number; order: number }
  next?: { id: number; order: number }
}) {
  const router = useRouter()
  const [title, setTitle] = useState(block.title)
  const [content, setContent] = useState(block.content)
  const [imageAlt, setImageAlt] = useState(block.imageAlt)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function patch(id: number, data: Record<string, unknown>) {
    const res = await fetch(`/api/content-blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? '요청에 실패했습니다.')
    }
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await patch(block.id, { title, content, imageAlt })
      router.refresh()
      notifyBlockChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive() {
    await patch(block.id, { active: !block.active })
    router.refresh()
    notifyBlockChanged()
  }

  async function remove() {
    if (!confirm('이 블럭을 삭제하시겠습니까?')) return
    await fetch(`/api/content-blocks/${block.id}`, { method: 'DELETE' })
    router.refresh()
    notifyBlockChanged()
  }

  async function swapWith(sibling: { id: number; order: number } | undefined) {
    if (!sibling) return
    await Promise.all([patch(block.id, { order: sibling.order }), patch(sibling.id, { order: block.order })])
    router.refresh()
    notifyBlockChanged()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">
          {block.type === 'text' ? '콘텐츠 블럭' : '배너 이미지'} · 순서{' '}
          {block.order}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => swapWith(prev)}
            disabled={!prev}
            className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
            title="위로"
          >
            ▲
          </button>
          <button
            onClick={() => swapWith(next)}
            disabled={!next}
            className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
            title="아래로"
          >
            ▼
          </button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
        placeholder="제목 (선택)"
      />

      {block.type === 'text' ? (
        <RichEditor value={content} onChange={setContent} />
      ) : (
        <div className="space-y-2">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-50">
            <Image src={block.imageUrl} alt={imageAlt} fill className="object-contain" unoptimized />
          </div>
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder="이미지 설명(alt)"
          />
        </div>
      )}

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
            block.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {block.active ? '활성' : '비활성'}
        </button>
        <button onClick={remove} className="px-3 py-1.5 rounded-full text-xs bg-red-100 text-red-600">
          삭제
        </button>
      </div>
    </div>
  )
}
