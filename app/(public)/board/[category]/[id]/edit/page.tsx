'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

export default function PublicEditPage() {
  const router = useRouter()
  const { category, id } = useParams<{ category: string; id: string }>()

  const [step, setStep] = useState<'verify' | 'edit'>('verify')
  const [password, setPassword] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [form, setForm] = useState({ title: '', content: '', author: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((post) => setForm({ title: post.title, content: post.content, author: post.author }))
  }, [id])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setVerifyError('')
    const res = await fetch(`/api/posts/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      setStep('edit')
    } else {
      const data = await res.json()
      setVerifyError(data.error ?? '비밀번호가 틀렸습니다.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, password }),
    })
    if (res.ok) {
      router.push(`/board/${category}/${id}`)
      router.refresh()
    }
    setLoading(false)
  }

  if (step === 'verify') {
    return (
      <div className="verifyWrap">
        <form onSubmit={handleVerify} className="verifyCard">
          <h2>본인 확인</h2>
          <p>게시글 작성 시 입력한 비밀번호를 입력하세요.</p>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="formField"
            autoFocus
          />
          {verifyError && <p className="formError">{verifyError}</p>}
          <div className="formActions">
            <button type="button" onClick={() => router.back()} className="btnGhost">
              취소
            </button>
            <button type="submit" disabled={loading || !password} className="btnPrimary">
              {loading ? '확인 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="subContent">
      <h1 className="formTitle">게시글 수정</h1>
      <form onSubmit={handleSubmit} className="formCard">
        <input
          className="formField"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="formField"
          placeholder="작성자"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />
        <RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
        <div className="formActions">
          <button type="button" onClick={() => router.back()} className="btnGhost">
            취소
          </button>
          <button type="submit" disabled={loading} className="btnPrimary">
            {loading ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
