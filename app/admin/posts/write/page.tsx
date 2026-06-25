'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BOARD_META } from '@/lib/board'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

function AdminWriteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? 'nt1'
  const meta = BOARD_META[category] ?? BOARD_META['nt1']

  const [form, setForm] = useState({ title: '', content: '', author: '관리자' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, category, isAdmin: true }),
    })
    if (res.ok) {
      router.push(`/admin/posts?category=${category}`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">{meta.label} 글쓰기</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <input
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
          placeholder="작성자"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />
        <RichEditor
          value={form.content}
          onChange={(html) => setForm({ ...form, content: html })}
          placeholder="내용을 입력하세요."
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e] disabled:opacity-50"
          >
            {loading ? '저장 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminWritePage() {
  return (
    <Suspense>
      <AdminWriteForm />
    </Suspense>
  )
}
