'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DonationForm() {
  const [form, setForm] = useState({ year: new Date().getFullYear(), month: 1, content: '' })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/donation-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.refresh()
    setForm({ ...form, content: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 flex gap-4 items-end flex-wrap">
      <div>
        <label className="block text-xs text-gray-500 mb-1">연도</label>
        <input
          type="number"
          className="border rounded-lg px-3 py-2 text-sm w-24"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">월</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={form.month}
          onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs text-gray-500 mb-1">내용</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="후원금품 내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e]"
      >
        저장
      </button>
    </form>
  )
}
