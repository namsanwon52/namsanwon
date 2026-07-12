'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '로그인에 실패했습니다.')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="joinWrap">
      <form className="loginCard" onSubmit={handleSubmit}>
        <div className="loginFormRow">
          <div className="loginFields">
            <div className="loginFieldInline">
              <label>아이디</label>
              <input
                className="formField"
                placeholder="아이디 입력"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>
            <div className="loginFieldInline">
              <label>비밀번호</label>
              <input
                type="password"
                className="formField"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="loginSubmitBtn" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {error && <p className="formError">{error}</p>}

        <div className="loginLinksRow">
          <Link href="/member/find-account">아이디 찾기</Link>
          <span className="sep">|</span>
          <Link href="/member/find-account">비밀번호 재설정</Link>
        </div>

        <hr className="loginDivider" />

        <div className="loginFooterRow">
          <span aria-hidden="true">🔎</span>
          <span>아이디가 없으신가요?</span>
          <Link href="/member/join">회원가입</Link>
        </div>
      </form>
    </div>
  )
}
