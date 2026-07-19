'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPasswordNoticeModal, setShowPasswordNoticeModal] = useState(false)
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
        if (data.code === 'PASSWORD_NOT_SET') {
          setShowPasswordNoticeModal(true)
          return
        }
        setError(data.error ?? '로그인에 실패했습니다.')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  function goToPasswordReset() {
    router.push(`/member/find-account?id=${encodeURIComponent(id)}&reason=password-not-set`)
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

      {showPasswordNoticeModal && (
        <div className="modalOverlay">
          <div className="modalCard passwordNoticeCard">
            <h3>안내</h3>
            <p>남산원을 찾아주시는 모든 분들께 감사드립니다.</p>
            <p>
              홈페이지 개편으로 서비스가 한층 더 편리해졌습니다.
              <br />
              회원님의 소중한 정보를 안전하게 보호하기 위해
              <br />
              비밀번호를 한 번만 새로 설정해 주시면 됩니다.
            </p>
            <p>
              잠시만 함께해 주시면
              <br />
              앞으로 더 편안한 환경에서 남산원을 이용하실 수 있습니다.
            </p>
            <p>늘 회원님을 먼저 생각하는 남산원이 되겠습니다.</p>
            <div className="formActions">
              <button className="btnGhost" onClick={() => setShowPasswordNoticeModal(false)}>
                닫기
              </button>
              <button className="btnPrimary" onClick={goToPasswordReset}>
                비밀번호 변경하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
