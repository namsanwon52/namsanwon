'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FloorForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/facility/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '등록에 실패했습니다.')
      return
    }

    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 flex gap-3 items-end flex-wrap">
      <div className="flex-1 min-w-[240px]">
        <label className="block text-xs text-gray-500 mb-1">층 이름</label>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#88b04b]"
          placeholder="예) 본관 지상1층"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-[#88b04b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#456805] transition-colors disabled:opacity-50"
      >
        {saving ? '등록 중...' : '+ 층 추가'}
      </button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </form>
  )
}
