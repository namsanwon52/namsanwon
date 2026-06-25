'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { getBoardMeta } from '@/lib/board'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

export default function WritePage() {
  const params = useParams()
  const category = params.category as string
  const meta = getBoardMeta(category)
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '', author: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (meta.adminOnly) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        관리자만 작성할 수 있는 게시판입니다.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '작성에 실패했습니다.')
        return
      }
      const post = await res.json()
      router.push(`/board/${category}/${post.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title={`${meta.label} 글쓰기`} breadcrumb={['게시판', meta.label, '글쓰기']} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder="제목 *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="작성자 *"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
            <input
              type="password"
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="비밀번호 * (수정/삭제 시 필요)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <RichEditor
            value={form.content}
            onChange={(html) => setForm({ ...form, content: html })}
            placeholder="내용을 입력하세요."
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e] disabled:opacity-50 transition-colors"
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
