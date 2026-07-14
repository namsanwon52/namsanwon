'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { notifyBlockChanged } from './blockEvents'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

type BlockType = 'text' | 'full-image'

export default function BlockForm({ page }: { page: string }) {
  const router = useRouter()
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [imageAlt, setImageAlt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function switchImageMode(next: 'url' | 'file') {
    setImageMode(next)
    setImageUrl('')
    setFile(null)
  }

  function resetForm() {
    setTitle('')
    setContent('')
    setImageUrl('')
    setFile(null)
    setImageAlt('')
  }

  async function resolveImageUrl() {
    if (imageMode === 'file') {
      if (!file) return null
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploaded = await uploadRes.json()
      return uploaded.url as string
    }
    return imageUrl || null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (blockType === 'full-image') {
        const confirmed = window.confirm(
          '배너 이미지로 변경시, 기존에 등록된 블럭이 모두 삭제 됩니다. 진행하시겠습니까?'
        )
        if (!confirmed) return

        const finalImageUrl = await resolveImageUrl()
        if (!finalImageUrl) {
          setError('이미지 URL을 입력하거나 파일을 선택해주세요.')
          return
        }

        const res = await fetch('/api/content-blocks/replace-full-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, imageUrl: finalImageUrl, imageAlt }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? '변경에 실패했습니다.')
          return
        }

        resetForm()
        router.refresh()
        notifyBlockChanged()
        return
      }

      const res = await fetch('/api/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, type: 'text', title, content }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '블럭 추가에 실패했습니다.')
        return
      }

      resetForm()
      router.refresh()
      notifyBlockChanged()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="blockType" checked={blockType === 'text'} onChange={() => setBlockType('text')} />
          콘텐츠 블럭
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="blockType"
            checked={blockType === 'full-image'}
            onChange={() => setBlockType('full-image')}
          />
          배너 이미지
        </label>
      </div>

      {blockType === 'full-image' && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          배너 이미지로 등록하면 기존에 등록된 모든 블럭이 삭제되고, 이 이미지가 페이지 내용 영역 전체를 차지합니다.
        </p>
      )}

      {blockType === 'text' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder="예: 자원봉사 신청 안내"
          />
        </div>
      )}

      {blockType === 'text' ? (
        <RichEditor value={content} onChange={setContent} placeholder="내용을 입력하세요." />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="imageMode" checked={imageMode === 'url'} onChange={() => switchImageMode('url')} />
              URL 등록
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="imageMode" checked={imageMode === 'file'} onChange={() => switchImageMode('file')} />
              로컬 파일 등록
            </label>
          </div>
          {imageMode === 'url' ? (
            <input
              key="url"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="https://..."
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
                />
              </label>
              <span className="flex-1 min-w-0 truncate text-sm text-gray-500">
                {file ? file.name : '선택된 파일 없음'}
              </span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

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
