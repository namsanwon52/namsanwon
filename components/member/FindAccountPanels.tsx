'use client'
import { useState } from 'react'

export default function FindAccountPanels() {
  const [idForm, setIdForm] = useState({ name: '', email: '' })
  const [idResult, setIdResult] = useState('')
  const [idError, setIdError] = useState('')
  const [idSubmitting, setIdSubmitting] = useState(false)

  const [pwForm, setPwForm] = useState({ id: '', name: '', email: '' })
  const [pwResult, setPwResult] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)

  async function handleFindId(e: React.FormEvent) {
    e.preventDefault()
    setIdSubmitting(true)
    setIdError('')
    setIdResult('')
    try {
      const res = await fetch('/api/member/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setIdError(data.error ?? '아이디 찾기에 실패했습니다.')
        return
      }
      setIdResult(data.id)
    } finally {
      setIdSubmitting(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwSubmitting(true)
    setPwError('')
    setPwResult('')
    try {
      const res = await fetch('/api/member/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error ?? '비밀번호 재설정에 실패했습니다.')
        return
      }
      setPwResult(data.tempPassword)
    } finally {
      setPwSubmitting(false)
    }
  }

  return (
    <div className="findWrap">
      <div className="findGrid">
        <form className="findCard" onSubmit={handleFindId}>
          <div className="findCardHead">
            <div>
              <h2>아이디 찾기</h2>
              <p>
                사용자 아이디를 잊어버리셨나요?
                <br />
                회원님의 이름과 가입 시 작성하신 이메일 주소를 입력해주세요.
              </p>
            </div>
            <span className="findCardIcon" aria-hidden="true">🔍</span>
          </div>
          <hr className="findDivider" />
          <div className="findFields">
            <div className="findFieldInline">
              <label>이름</label>
              <input
                className="formField"
                placeholder="이름 입력"
                value={idForm.name}
                onChange={(e) => setIdForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="findFieldInline">
              <label>이메일</label>
              <input
                type="email"
                className="formField"
                placeholder="이메일 입력"
                value={idForm.email}
                onChange={(e) => setIdForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>
          {idResult && (
            <p className="findResult">
              회원님의 아이디는 <strong>{idResult}</strong> 입니다.
            </p>
          )}
          {idError && <p className="formError">{idError}</p>}
          <button type="submit" className="btnPrimaryBlock" disabled={idSubmitting}>
            {idSubmitting ? '확인 중...' : '확인'}
          </button>
        </form>

        <form className="findCard" onSubmit={handleResetPassword}>
          <div className="findCardHead">
            <div>
              <h2>비밀번호 찾기</h2>
              <p>
                비밀번호를 잊어버리셨나요?
                <br />
                아이디와 이름, 가입 시 작성하신 이메일 주소를 입력해 주세요.
              </p>
            </div>
            <span className="findCardIcon" aria-hidden="true">🔒</span>
          </div>
          <hr className="findDivider" />
          <div className="findFields">
            <div className="findFieldInline">
              <label>아이디</label>
              <input
                className="formField"
                placeholder="아이디 입력"
                value={pwForm.id}
                onChange={(e) => setPwForm((p) => ({ ...p, id: e.target.value }))}
                required
              />
            </div>
            <div className="findFieldInline">
              <label>이름</label>
              <input
                className="formField"
                placeholder="이름 입력"
                value={pwForm.name}
                onChange={(e) => setPwForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="findFieldInline">
              <label>이메일</label>
              <input
                type="email"
                className="formField"
                placeholder="이메일 입력"
                value={pwForm.email}
                onChange={(e) => setPwForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>
          {pwResult && (
            <p className="findResult">
              임시 비밀번호는 <strong>{pwResult}</strong> 입니다. 로그인 후 반드시 비밀번호를 변경해주세요.
            </p>
          )}
          {pwError && <p className="formError">{pwError}</p>}
          <button type="submit" className="btnPrimaryBlock" disabled={pwSubmitting}>
            {pwSubmitting ? '확인 중...' : '확인'}
          </button>
        </form>
      </div>
    </div>
  )
}
