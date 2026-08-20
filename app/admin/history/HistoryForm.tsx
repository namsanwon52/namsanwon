'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CURRENT_YEAR = new Date().getFullYear()

export default function HistoryForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/history-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: Number(year),
        month: month === '' ? null : Number(month),
        day: day === '' ? null : Number(day),
        content,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '저장에 실패했습니다.')
      return
    }

    setContent('')
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#88b04b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#456805] transition-colors"
      >
        + 새 연혁
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">연도</label>
          <input
            type="number"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#88b04b]"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">월</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#88b04b]"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">월 없음</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">일 (선택)</label>
          <input
            type="number"
            min={1}
            max={31}
            placeholder="-"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-[#88b04b]"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs text-gray-500 mb-1">내용</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#88b04b]"
            placeholder="예) 아동복지시설 평가 A등급"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#88b04b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#456805] transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          닫기
        </button>
      </div>
    </form>
  )
}
