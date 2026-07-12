'use client'
import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    daum?: {
      Postcode: new (config: { oncomplete: (data: { zonecode: string; address: string }) => void }) => {
        open: () => void
      }
    }
  }
}

const STEPS = [
  { no: 1, label: '약관 동의' },
  { no: 2, label: '정보 입력' },
  { no: 3, label: '가입 완료' },
]

const TERMS_TEXT = `제1조 (목적) 본 약관은 사회복지법인 남산원(이하 "원"이라 한다)이 제공하는 인터넷 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제2조 (약관의 효력과 변경) 1. 원은 이용자가 본 약관 내용에 동의하는 것을 조건으로 서비스를 제공할 것이며, 이용자가 본 약관의 내용에 동의하는 경우 원의 서비스 제공 행위 및 이용자의 서비스 이용 행위에는 본 약관이 우선적으로 적용됩니다.

제3조 (이용자의 의무) 이용자는 서비스 이용 시 다음 각 호의 행위를 하지 않기로 동의합니다. 타인의 아이디와 비밀번호를 도용하는 행위, 저속·음란·모욕적·위협적이거나 타인의 사생활을 침해할 수 있는 내용을 저장·게시·게재·전자메일 또는 기타의 방법으로 전송하는 행위 등.`

const PRIVACY_TEXT = `사회복지법인 남산원은 귀하의 개인정보 보호를 매우 중요시하며, 『개인정보보호법』을 준수하고 있습니다. 원은 개인정보취급방침을 통하여 귀하께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.

1. 수집하는 개인정보 항목: 성명, 생년월일, 성별, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 이메일 등

2. 개인정보의 수집 및 이용목적: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인, 불만처리 등 민원처리, 고지사항 전달 등`

type TermsState = { terms: boolean; privacy: boolean }

type InfoState = {
  id: string
  password: string
  passwordConfirm: string
  name: string
  tphone: string
  hphone: string
  smsConsent: boolean
  email: string
  emailConsent: boolean
  post: string
  address1: string
  address2: string
}

const INITIAL_INFO: InfoState = {
  id: '',
  password: '',
  passwordConfirm: '',
  name: '',
  tphone: '',
  hphone: '',
  smsConsent: false,
  email: '',
  emailConsent: false,
  post: '',
  address1: '',
  address2: '',
}

export default function JoinWizard() {
  const [step, setStep] = useState(1)
  const [terms, setTerms] = useState<TermsState>({ terms: false, privacy: false })
  const [info, setInfo] = useState<InfoState>(INITIAL_INFO)
  const [idCheck, setIdCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateInfo<K extends keyof InfoState>(key: K, value: InfoState[K]) {
    setInfo((prev) => ({ ...prev, [key]: value }))
    if (key === 'id') setIdCheck('idle')
  }

  async function handleCheckId() {
    if (!info.id) return
    setIdCheck('checking')
    try {
      const res = await fetch(`/api/member/check-id?id=${encodeURIComponent(info.id)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '아이디 확인에 실패했습니다.')
        setIdCheck('idle')
        return
      }
      setIdCheck(data.available ? 'available' : 'taken')
    } catch {
      setIdCheck('idle')
    }
  }

  function openPostcode() {
    if (!window.daum) return
    new window.daum.Postcode({
      oncomplete: (data) => {
        setInfo((prev) => ({ ...prev, post: data.zonecode, address1: data.address }))
      },
    }).open()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (info.password !== info.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '가입 처리 중 오류가 발생했습니다.')
        return
      }
      setStep(3)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="joinWrap">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

      <div className="joinStepper">
        {STEPS.map((s, i) => (
          <div key={s.no} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`joinStep ${step === s.no ? 'isActive' : ''}`}>
              <span className="joinStepNo">{s.no}</span>
              <span className="joinStepLabel">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="joinStepLine" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="joinCard">
          <h1 className="joinCardTitle">회원가입 약관동의</h1>
          <div className="joinSection">
            <h3>
              회원가입 약관 <span className="req">*</span>
            </h3>
            <div className="termsBox">{TERMS_TEXT}</div>
            <label className="termsCheckRow">
              <input
                type="checkbox"
                checked={terms.terms}
                onChange={(e) => setTerms((p) => ({ ...p, terms: e.target.checked }))}
              />
              회원가입약관에 동의합니다.
            </label>
          </div>
          <div className="joinSection">
            <h3>
              개인정보취급방침 <span className="req">*</span>
            </h3>
            <div className="termsBox">{PRIVACY_TEXT}</div>
            <label className="termsCheckRow">
              <input
                type="checkbox"
                checked={terms.privacy}
                onChange={(e) => setTerms((p) => ({ ...p, privacy: e.target.checked }))}
              />
              개인정보취급방침에 동의합니다.
            </label>
          </div>
          <label className="joinAllCheckRow">
            <input
              type="checkbox"
              checked={terms.terms && terms.privacy}
              onChange={(e) => setTerms({ terms: e.target.checked, privacy: e.target.checked })}
            />
            전체 약관에 동의합니다.
          </label>
          <button
            type="button"
            className="btnPrimaryBlock"
            disabled={!terms.terms || !terms.privacy}
            onClick={() => setStep(2)}
          >
            동의하고 다음 단계로
          </button>
        </div>
      )}

      {step === 2 && (
        <form className="joinCard" onSubmit={handleSubmit}>
          <h1 className="joinCardTitle">회원정보 입력</h1>

          <div className="joinFieldGroup">
            <label>
              아이디 <span className="req">*</span>
            </label>
            <div className="joinFieldRow">
              <input
                className="formField"
                placeholder="아이디 입력"
                value={info.id}
                onChange={(e) => updateInfo('id', e.target.value)}
                required
              />
              <button
                type="button"
                className="btnGhostDark"
                onClick={handleCheckId}
                disabled={idCheck === 'checking'}
              >
                {idCheck === 'checking' ? '확인 중' : '중복 확인'}
              </button>
            </div>
            <p className="joinFieldHint">
              영문 숫자 포함 3~12자. 가입 후 ID변경은 불가합니다.
              {idCheck === 'available' && ' 사용 가능한 아이디입니다.'}
              {idCheck === 'taken' && ' 이미 사용 중인 아이디입니다.'}
            </p>
          </div>

          <div className="formRow2">
            <div className="joinFieldGroup">
              <label>
                비밀번호 <span className="req">*</span>
              </label>
              <input
                type="password"
                className="formField"
                placeholder="비밀번호 입력"
                value={info.password}
                onChange={(e) => updateInfo('password', e.target.value)}
                required
              />
            </div>
            <div className="joinFieldGroup">
              <label>
                비밀번호 확인 <span className="req">*</span>
              </label>
              <input
                type="password"
                className="formField"
                placeholder="비밀번호 재입력"
                value={info.passwordConfirm}
                onChange={(e) => updateInfo('passwordConfirm', e.target.value)}
                required
              />
            </div>
          </div>
          <p className="joinFieldHint" style={{ marginTop: -16 }}>
            특수문자 및 한글 입력 불가, 대소문자 구별. 4~12자리 입력
          </p>

          <div className="joinFieldGroup">
            <label>
              이름 <span className="req">*</span>
            </label>
            <input
              className="formField"
              placeholder="실명 입력"
              value={info.name}
              onChange={(e) => updateInfo('name', e.target.value)}
              required
            />
          </div>

          <div className="joinFieldGroup">
            <label>전화번호</label>
            <input
              className="formField"
              placeholder="ex) 02-1234-5678"
              value={info.tphone}
              onChange={(e) => updateInfo('tphone', e.target.value)}
            />
          </div>

          <div className="joinFieldGroup">
            <label>휴대폰</label>
            <input
              className="formField"
              placeholder="ex) 010-1234-5678"
              value={info.hphone}
              onChange={(e) => updateInfo('hphone', e.target.value)}
            />
            <div className="joinRadioRow">
              SMS 받으시겠습니까?
              <label className="radioOption">
                <input
                  type="radio"
                  name="smsConsent"
                  checked={info.smsConsent}
                  onChange={() => updateInfo('smsConsent', true)}
                />
                예
              </label>
              <label className="radioOption">
                <input
                  type="radio"
                  name="smsConsent"
                  checked={!info.smsConsent}
                  onChange={() => updateInfo('smsConsent', false)}
                />
                아니오
              </label>
            </div>
          </div>

          <div className="joinFieldGroup">
            <label>
              이메일 <span className="req">*</span>
            </label>
            <input
              type="email"
              className="formField"
              placeholder="example@email.com"
              value={info.email}
              onChange={(e) => updateInfo('email', e.target.value)}
              required
            />
            <div className="joinRadioRow">
              이메일을 받으시겠습니까?
              <label className="radioOption">
                <input
                  type="radio"
                  name="emailConsent"
                  checked={info.emailConsent}
                  onChange={() => updateInfo('emailConsent', true)}
                />
                예
              </label>
              <label className="radioOption">
                <input
                  type="radio"
                  name="emailConsent"
                  checked={!info.emailConsent}
                  onChange={() => updateInfo('emailConsent', false)}
                />
                아니오
              </label>
            </div>
          </div>

          <div className="joinFieldGroup">
            <label>
              주소 <span className="req">*</span>
            </label>
            <div className="joinAddressRow">
              <input className="formField" placeholder="우편번호" value={info.post} readOnly required />
              <button type="button" className="btnGhostDark" onClick={openPostcode}>
                우편번호 찾기
              </button>
            </div>
            <input
              className="formField"
              placeholder="기본 주소"
              value={info.address1}
              onChange={(e) => updateInfo('address1', e.target.value)}
              required
            />
            <input
              className="formField"
              placeholder="상세 주소 입력"
              value={info.address2}
              onChange={(e) => updateInfo('address2', e.target.value)}
            />
          </div>

          {error && <p className="formError">{error}</p>}

          <button type="submit" className="btnPrimaryBlock" disabled={submitting}>
            {submitting ? '가입 처리 중...' : '회원가입 완료'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="joinCard">
          <div className="joinDoneWrap">
            <div className="joinDoneIcon" aria-hidden="true">🫶</div>
            <h2>가입해주셔서 감사합니다.</h2>
            <p>입력하신 고객님의 정보는 개인정보취급방침에 따라 보호됩니다.</p>
            <div className="joinDoneActions">
              <Link href="/" className="btnPrimary">확인</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
