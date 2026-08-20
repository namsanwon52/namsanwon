'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatMonthLabel } from '@/lib/history'

type Entry = {
  id: number
  year: number
  month: number | null
  day: number | null
  content: string
  active: boolean
}

export default function HistoryRow({ entry, no }: { entry: Entry; no: number }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [year, setYear] = useState(String(entry.year))
  const [month, setMonth] = useState(entry.month === null ? '' : String(entry.month))
  const [day, setDay] = useState(entry.day === null ? '' : String(entry.day))
  const [content, setContent] = useState(entry.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/history-entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '저장에 실패했습니다.')
      return false
    }
    router.refresh()
    return true
  }

  async function save() {
    const ok = await patch({
      year: Number(year),
      month: month === '' ? null : Number(month),
      day: day === '' ? null : Number(day),
      content,
    })
    if (ok) setEditing(false)
  }

  async function remove() {
    if (!confirm(`${entry.year}년 연혁 "${entry.content}" 을(를) 삭제하시겠습니까?`)) return
    await fetch(`/api/history-entries/${entry.id}`, { method: 'DELETE' })
    router.refresh()
  }

  function cancel() {
    setYear(String(entry.year))
    setMonth(entry.month === null ? '' : String(entry.month))
    setDay(entry.day === null ? '' : String(entry.day))
    setContent(entry.content)
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-b bg-[#f7faf1]">
        <td className="py-3 px-4 text-center text-gray-400">{no}</td>
        <td className="py-3 px-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-[#88b04b]"
          />
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-1">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-[#88b04b]"
            >
              <option value="">-</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={31}
              placeholder="일"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-14 border border-gray-200 rounded-lg px-1 py-1 text-sm text-center focus:outline-none focus:border-[#88b04b]"
            />
          </div>
        </td>
        <td className="py-3 px-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#88b04b]"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 rounded-full text-xs bg-[#88b04b] text-white hover:bg-[#456805] disabled:opacity-50"
            >
              {saving ? '저장 중' : '저장'}
            </button>
            <button onClick={cancel} className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-600">
              취소
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`border-b ${entry.active ? '' : 'bg-gray-50 text-gray-400'}`}>
      <td className="py-3 px-4 text-center text-gray-400">{no}</td>
      <td className="py-3 px-4 text-center font-semibold">{entry.year}</td>
      <td className="py-3 px-4 text-center text-gray-500">
        {formatMonthLabel(entry.month, entry.day) || '-'}
      </td>
      <td className="py-3 px-4">{entry.content}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={() => patch({ active: !entry.active })}
            className={`px-3 py-1.5 rounded-full text-xs ${
              entry.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {entry.active ? '노출' : '숨김'}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            수정
          </button>
          <button onClick={remove} className="px-3 py-1.5 rounded-full text-xs bg-red-100 text-red-600">
            삭제
          </button>
        </div>
      </td>
    </tr>
  )
}
