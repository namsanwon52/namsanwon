'use client'
import { useState } from 'react'
import { rewritePostContent } from '@/lib/content'
import Comments from './Comments'

type FileRow = { id: number; url: string; filename: string }
type Post = { id: number; code: string; content: string; files: FileRow[] }

const isImg = (n: string) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(n)
const baseNoExt = (n: string) => n.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')

// 비밀글: 비밀번호 확인 후 본문/첨부/댓글 표시 (비관리자용)
export default function SecretPost({ id, category }: { id: number; category: string }) {
  const [password, setPassword] = useState('')
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        setPost(data.post)
      } else {
        setError((await res.json()).error ?? '비밀번호가 올바르지 않습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!post) {
    return (
      <div className="secretGate">
        <div className="secretGateIcon" aria-hidden="true">🔒</div>
        <p>비밀글입니다. 작성 시 입력한 비밀번호를 입력하세요.</p>
        <form onSubmit={handleVerify} className="secretGateForm">
          <input
            type="password"
            className="formField"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="formError">{error}</p>}
          <button type="submit" className="btnPrimary" disabled={loading || !password}>
            {loading ? '확인 중...' : '확인'}
          </button>
        </form>
      </div>
    )
  }

  const inlineImages = post.files.filter(
    (f) => isImg(f.filename) && !post.content.includes(baseNoExt(f.filename)),
  )
  const docFiles = post.files.filter((f) => !isImg(f.filename))

  return (
    <>
      <div
        className="postDetailBody"
        dangerouslySetInnerHTML={{ __html: rewritePostContent(post.content, category, post.files) }}
      />
      {inlineImages.length > 0 && (
        <div className="postImages">
          {inlineImages.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.id} src={f.url} alt={f.filename} loading="lazy" />
          ))}
        </div>
      )}
      {docFiles.length > 0 && (
        <div style={{ padding: '16px 4px', borderBottom: '1px solid var(--line-muted)' }}>
          <h3 style={{ fontSize: 'var(--font-h5)', fontWeight: 700, margin: '0 0 8px' }}>첨부파일</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {docFiles.map((f) => (
              <li key={f.id}>
                <a href={f.url} download={f.filename} style={{ color: 'var(--secondary)', fontSize: 'var(--font-h5)' }}>
                  📎 {f.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Comments postId={id} isAdmin={false} />
    </>
  )
}
