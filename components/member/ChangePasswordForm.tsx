'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/member/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '비밀번호 변경에 실패했습니다.')
        return
      }
      setSuccess('비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="joinFlow">
      <form className="joinFormCard" onSubmit={handleSubmit}>
        <div className="joinTermsHeader">
          <h3>비밀번호 변경</h3>
        </div>

        <div className="joinField">
          <label>
            현재 비밀번호 <em>*</em>
          </label>
          <input
            type="password"
            placeholder="현재 비밀번호 입력"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="joinField">
          <label>
            새 비밀번호 <em>*</em>
          </label>
          <input
            type="password"
            placeholder="새 비밀번호 입력"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p>특수문자 및 한글 입력 불가, 대소문자 구별. 4~12자리 입력</p>
        </div>
        <div className="joinField">
          <label>
            새 비밀번호 확인 <em>*</em>
          </label>
          <input
            type="password"
            placeholder="새 비밀번호 재입력"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>

        {error && <p className="formError">{error}</p>}
        {success && <p className="findResult">{success}</p>}

        <button className="joinNextButton" type="submit" disabled={submitting}>
          <span className="buttonText">{submitting ? '변경 중...' : '비밀번호 변경'}</span>
        </button>
      </form>
    </div>
  )
}
