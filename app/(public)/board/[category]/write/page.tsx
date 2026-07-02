'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PageBanner from '@/components/namsanwon/PageBanner'
import { getBoardMeta } from '@/lib/board'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

export default function WritePage() {
  const params = useParams()
  const category = params.category as string
  const meta = getBoardMeta(category)
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '', author: '', password: '', isSecret: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (meta.adminOnly) {
    return (
      <div className="subContent">
        <div className="contentCard">
          <p className="emptyNote">관리자만 작성할 수 있는 게시판입니다.</p>
        </div>
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
      <PageBanner title={`${meta.label} 글쓰기`} crumbs={[meta.label, '글쓰기']} />
      <div className="subContent">
        <form onSubmit={handleSubmit} className="formCard">
          <input
            className="formField"
            placeholder="제목 *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="formRow2">
            <input
              className="formField"
              placeholder="작성자 *"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
            <input
              type="password"
              className="formField"
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
          <label className="secretCheck">
            <input
              type="checkbox"
              checked={form.isSecret}
              onChange={(e) => setForm({ ...form, isSecret: e.target.checked })}
            />
            <span>🔒 비밀글로 작성 (작성자와 관리자만 열람 가능)</span>
          </label>
          {error && <p className="formError">{error}</p>}
          <div className="formActions">
            <button type="button" onClick={() => router.back()} className="btnGhost">
              취소
            </button>
            <button type="submit" disabled={loading} className="btnPrimary">
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
