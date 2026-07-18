'use client'
import { useRef, useState } from 'react'

type PwStep = 'form' | 'code' | 'newPassword' | 'done'

const CODE_LENGTH = 6

export default function FindAccountPanels() {
  const [idForm, setIdForm] = useState({ name: '', email: '' })
  const [idResult, setIdResult] = useState('')
  const [idError, setIdError] = useState('')
  const [idSubmitting, setIdSubmitting] = useState(false)

  const [pwStep, setPwStep] = useState<PwStep>('form')
  const [pwForm, setPwForm] = useState({ id: '', name: '', email: '' })
  const [pwError, setPwError] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const [resetToken, setResetToken] = useState('')
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([])

  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

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

  function resetPwFlow() {
    setPwStep('form')
    setResetToken('')
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setNewPassword('')
    setNewPasswordConfirm('')
    setPwError('')
  }

  async function requestResetCode() {
    setPwSubmitting(true)
    setPwError('')
    try {
      const res = await fetch('/api/member/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error ?? '인증번호 발송에 실패했습니다.')
        return
      }
      setResetToken(data.resetToken)
      setCodeDigits(Array(CODE_LENGTH).fill(''))
      setPwStep('code')
    } finally {
      setPwSubmitting(false)
    }
  }

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    await requestResetCode()
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setCodeDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setPwSubmitting(true)
    setPwError('')
    try {
      const res = await fetch('/api/member/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, code: codeDigits.join('') }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error ?? '인증번호 확인에 실패했습니다.')
        return
      }
      setResetToken(data.resetToken)
      setPwStep('newPassword')
    } finally {
      setPwSubmitting(false)
    }
  }

  async function handleConfirmNewPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwSubmitting(true)
    setPwError('')
    try {
      const res = await fetch('/api/member/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword, newPasswordConfirm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error ?? '비밀번호 재설정에 실패했습니다.')
        return
      }
      setPwStep('done')
    } finally {
      setPwSubmitting(false)
    }
  }

  return (
    <div className="findAccountPanel">
      {pwStep === 'form' && (
        <div className="findAccountCards">
          <article className="findAccountCard">
            <header className="findAccountHeader">
              <div>
                <h3>아이디 찾기</h3>
                <p>사용자 아이디를 잊어버리셨나요?</p>
                <p>회원님의 이름과 가입 시 작성하신 이메일 주소를 입력해주세요.</p>
              </div>
            </header>
            <form className="findAccountForm" onSubmit={handleFindId}>
              <div className="findAccountFields">
                <div className="findAccountField">
                  <label htmlFor="findUserName">이름</label>
                  <input
                    id="findUserName"
                    placeholder="이름 입력"
                    value={idForm.name}
                    onChange={(e) => setIdForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="findAccountField">
                  <label htmlFor="findUserEmail">이메일</label>
                  <input
                    id="findUserEmail"
                    type="email"
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
              <button className="findAccountButton" type="submit" disabled={idSubmitting}>
                <span className="buttonText">{idSubmitting ? '확인 중...' : '확인'}</span>
              </button>
            </form>
          </article>

          <article className="findAccountCard">
            <header className="findAccountHeader">
              <div>
                <h3>비밀번호 재설정</h3>
                <p>비밀번호를 잊어버리셨나요?</p>
                <p>아이디와 이름, 가입 시 작성하신 이메일 주소를 입력해 주세요.</p>
              </div>
            </header>
            <form className="findAccountForm" onSubmit={handleRequestReset}>
              <div className="findAccountFields">
                <div className="findAccountField">
                  <label htmlFor="resetUserId">아이디</label>
                  <input
                    id="resetUserId"
                    placeholder="아이디 입력"
                    value={pwForm.id}
                    onChange={(e) => setPwForm((p) => ({ ...p, id: e.target.value }))}
                    required
                  />
                </div>
                <div className="findAccountField">
                  <label htmlFor="resetUserName">이름</label>
                  <input
                    id="resetUserName"
                    placeholder="이름 입력"
                    value={pwForm.name}
                    onChange={(e) => setPwForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="findAccountField">
                  <label htmlFor="resetUserEmail">이메일</label>
                  <input
                    id="resetUserEmail"
                    type="email"
                    placeholder="이메일 입력"
                    value={pwForm.email}
                    onChange={(e) => setPwForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {pwError && <p className="formError">{pwError}</p>}
              <button className="findAccountButton" type="submit" disabled={pwSubmitting}>
                <span className="buttonText">{pwSubmitting ? '발송 중...' : '인증번호 받기'}</span>
              </button>
            </form>
          </article>
        </div>
      )}

      {pwStep === 'code' && (
        <section className="findAccountVerifyPanel" aria-label="인증번호 입력하기">
          <article className="findAccountCard findAccountVerifyCard">
            <header className="findAccountHeader">
              <div>
                <h3>인증번호 입력하기</h3>
                <p>메일로 인증번호를 전송하였습니다.</p>
                <p>입력하신 이메일로 전송 받은 6자리 번호를 입력해주세요.</p>
              </div>
            </header>
            <form className="findAccountForm findAccountVerifyForm" onSubmit={handleVerifyCode}>
              <div className="findAccountCodeGroup" aria-label="인증번호 6자리">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      codeInputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    aria-label={`인증번호 ${index + 1}번째 자리`}
                  />
                ))}
              </div>
              {pwError && <p className="formError">{pwError}</p>}
              <button
                className="findAccountButton"
                type="submit"
                disabled={pwSubmitting || codeDigits.some((d) => !d)}
              >
                <span className="buttonText">{pwSubmitting ? '확인 중...' : '확인'}</span>
              </button>
              <p className="findAccountResend">
                인증번호를 받지 못하셨나요?{' '}
                <button type="button" onClick={requestResetCode} disabled={pwSubmitting}>
                  재전송
                </button>
                {' · '}
                <button type="button" onClick={resetPwFlow}>
                  처음부터 다시
                </button>
              </p>
            </form>
          </article>
        </section>
      )}

      {pwStep === 'newPassword' && (
        <section className="findAccountResetPanel" aria-label="비밀번호 재설정하기">
          <article className="findAccountCard findAccountResetCard">
            <header className="findAccountHeader">
              <div>
                <h3>비밀번호 재설정하기</h3>
                <p>이메일 인증되었습니다.</p>
                <p>새로운 비밀번호를 입력해주세요.</p>
              </div>
            </header>
            <form className="findAccountForm findAccountResetForm" onSubmit={handleConfirmNewPassword}>
              <div className="findAccountResetFields">
                <div className="findAccountResetField">
                  <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p>* 특수문자·한글 없이 영문/숫자 4~12자로 입력해주세요.</p>
                </div>
                <div className="findAccountResetField">
                  <input
                    type="password"
                    placeholder="비밀번호 재확인"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                  />
                  <p>* 비밀번호를 다시 입력해주세요.</p>
                </div>
              </div>
              {pwError && <p className="formError">{pwError}</p>}
              <button className="findAccountButton" type="submit" disabled={pwSubmitting}>
                <span className="buttonText">{pwSubmitting ? '변경 중...' : '재설정하기'}</span>
              </button>
            </form>
          </article>
        </section>
      )}

      {pwStep === 'done' && (
        <section className="findAccountResetPanel" aria-label="비밀번호 재설정 완료">
          <article className="findAccountCard findAccountResetCard">
            <header className="findAccountHeader">
              <div>
                <h3>비밀번호가 변경되었습니다</h3>
                <p>새 비밀번호로 로그인해주세요.</p>
              </div>
            </header>
            <a className="findAccountButton" href="/member/login">
              <span className="buttonText">로그인하러 가기</span>
            </a>
          </article>
        </section>
      )}
    </div>
  )
}
