'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FIELDS = [
  { value: 'all', label: '전체' },
  { value: 'id', label: '아이디' },
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
  { value: 'hphone', label: '연락처' },
  { value: 'nick', label: '닉네임' },
] as const

export default function UsersSearchBar({
  field: initialField,
  q: initialQ,
}: {
  field: string
  q: string
}) {
  const router = useRouter()
  const [field, setField] = useState(initialField)
  const [q, setQ] = useState(initialQ)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (field !== 'all' && !q.trim()) {
      alert('검색어를 입력해주세요.')
      return
    }
    const params = new URLSearchParams()
    params.set('field', field)
    if (field !== 'all' && q) params.set('q', q)
    router.push(`/admin/users?${params.toString()}`)
  }

  function handleFieldChange(value: string) {
    setField(value)
    if (value === 'all') setQ('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <select
          value={field}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-[#1b1c1c] bg-white cursor-pointer hover:border-[#88b04b] focus:outline-none focus:border-[#88b04b] focus:ring-1 focus:ring-[#88b04b]"
        >
          {FIELDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#88b04b]">
          ▼
        </span>
      </div>
      {field !== 'all' && (
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 bg-white text-[#1b1c1c] shadow-sm focus:outline-none focus:border-[#88b04b] focus:ring-1 focus:ring-[#88b04b]"
        />
      )}
      <button
        type="submit"
        className="bg-[#88b04b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#456805]"
      >
        조회
      </button>
    </form>
  )
}
