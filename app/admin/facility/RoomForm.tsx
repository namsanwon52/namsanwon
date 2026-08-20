'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 공간 추가: 사진 파일을 /api/upload로 올린 뒤(WebP 재인코딩) 그 URL로 공간을 만든다.
export default function RoomForm({ floorId }: { floorId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('사진 파일을 선택해 주세요.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        setError('사진 업로드에 실패했습니다.')
        return
      }
      const uploaded = await uploadRes.json()

      const res = await fetch('/api/facility/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorId, name, imageUrl: uploaded.url, imageAlt: name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '등록에 실패했습니다.')
        return
      }

      setName('')
      setFile(null)
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        + 공간 추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-gray-500 mb-1">공간 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 상담실"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#88b04b]"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-gray-500 mb-1">사진</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-2 rounded-lg text-xs bg-[#88b04b] text-white hover:bg-[#456805] disabled:opacity-50"
        >
          {saving ? '등록 중...' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600"
        >
          취소
        </button>
      </div>
    </form>
  )
}
