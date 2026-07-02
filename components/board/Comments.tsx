'use client'
import { useEffect, useState, useCallback } from 'react'

type Comment = {
  id: number
  author: string
  content: string
  isAdmin: boolean
  createdAt: string
  hasPassword: boolean
}

export default function Comments({ postId, isAdmin }: { postId: number; isAdmin: boolean }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ author: '', password: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}/comments`)
    if (res.ok) setComments(await res.json())
    setLoaded(true)
  }, [postId])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ author: '', password: '', content: '' })
        await load()
      } else {
        const d = await res.json()
        setError(d.error ?? '댓글 등록 실패')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c: Comment) {
    let password: string | undefined
    if (!isAdmin) {
      if (!c.hasPassword) return
      password = window.prompt('댓글 비밀번호를 입력하세요.') ?? undefined
      if (!password) return
    } else if (!confirm('댓글을 삭제하시겠습니까?')) {
      return
    }
    const res = await fetch(`/api/comments/${c.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: password ? JSON.stringify({ password }) : undefined,
    })
    if (res.ok) await load()
    else alert((await res.json()).error ?? '삭제 실패')
  }

  return (
    <section className="commentSection" aria-label="댓글">
      <h3 className="commentTitle">
        댓글 <span>{comments.length}</span>
      </h3>

      <ul className="commentList">
        {loaded && comments.length === 0 && (
          <li className="commentEmpty">첫 댓글을 남겨보세요.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="commentItem">
            <div className="commentMeta">
              <span className={`commentAuthor${c.isAdmin ? ' isAdmin' : ''}`}>
                {c.isAdmin && <em className="adminBadge">관리자</em>}
                {c.author}
              </span>
              <span className="commentDate">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
              {(isAdmin || c.hasPassword) && (
                <button type="button" className="commentDelete" onClick={() => handleDelete(c)}>
                  삭제
                </button>
              )}
            </div>
            <p className="commentBody">{c.content}</p>
          </li>
        ))}
      </ul>

      <form className="commentForm" onSubmit={handleSubmit}>
        {!isAdmin && (
          <div className="commentFormRow">
            <input
              className="formField"
              placeholder="이름"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <input
              type="password"
              className="formField"
              placeholder="비밀번호"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        )}
        <textarea
          className="formField commentTextarea"
          placeholder="댓글을 입력하세요."
          rows={3}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        {error && <p className="formError">{error}</p>}
        <div className="commentFormActions">
          <button type="submit" className="btnPrimary" disabled={submitting}>
            {submitting ? '등록 중...' : '댓글 등록'}
          </button>
        </div>
      </form>
    </section>
  )
}
