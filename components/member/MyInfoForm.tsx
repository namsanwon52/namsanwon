'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

type InfoState = {
  id: string
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

export default function MyInfoForm({ initial }: { initial: InfoState }) {
  const [info, setInfo] = useState<InfoState>(initial)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  function updateInfo<K extends keyof InfoState>(key: K, value: InfoState[K]) {
    setInfo((prev) => ({ ...prev, [key]: value }))
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
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/member/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '저장 중 오류가 발생했습니다.')
        return
      }
      setSuccess('저장되었습니다.')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="joinFlow">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

      <form className="joinFormCard" onSubmit={handleSubmit}>
        <div className="joinTermsHeader">
          <h3>회원정보 수정</h3>
        </div>

        <div className="joinField">
          <label>아이디</label>
          <input type="text" value={info.id} readOnly disabled />
        </div>

        <div className="joinField">
          <label>
            이름 <em>*</em>
          </label>
          <input
            type="text"
            placeholder="실명 입력"
            value={info.name}
            onChange={(e) => updateInfo('name', e.target.value)}
            required
          />
        </div>

        <div className="joinField">
          <label>전화번호</label>
          <input
            type="tel"
            placeholder="ex) 02-1234-5678"
            value={info.tphone}
            onChange={(e) => updateInfo('tphone', e.target.value)}
          />
        </div>

        <div className="joinField">
          <label>
            휴대폰 <em>*</em>
          </label>
          <input
            type="tel"
            placeholder="ex) 010-1234-5678"
            value={info.hphone}
            onChange={(e) => updateInfo('hphone', e.target.value)}
            required
          />
          <div className="joinRadioLine">
            <span>SMS 받으시겠습니까?</span>
            <label className="joinRadio joinRadioMedium">
              <input
                type="radio"
                name="smsConsent"
                checked={info.smsConsent}
                onChange={() => updateInfo('smsConsent', true)}
              />
              <span aria-hidden="true" />
              <b>예</b>
            </label>
            <label className="joinRadio joinRadioMedium">
              <input
                type="radio"
                name="smsConsent"
                checked={!info.smsConsent}
                onChange={() => updateInfo('smsConsent', false)}
              />
              <span aria-hidden="true" />
              <b>아니오</b>
            </label>
          </div>
        </div>

        <div className="joinField">
          <label>
            이메일 <em>*</em>
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={info.email}
            onChange={(e) => updateInfo('email', e.target.value)}
            required
          />
          <div className="joinRadioLine">
            <span>이메일을 받으시겠습니까?</span>
            <label className="joinRadio joinRadioMedium">
              <input
                type="radio"
                name="emailConsent"
                checked={info.emailConsent}
                onChange={() => updateInfo('emailConsent', true)}
              />
              <span aria-hidden="true" />
              <b>예</b>
            </label>
            <label className="joinRadio joinRadioMedium">
              <input
                type="radio"
                name="emailConsent"
                checked={!info.emailConsent}
                onChange={() => updateInfo('emailConsent', false)}
              />
              <span aria-hidden="true" />
              <b>아니오</b>
            </label>
          </div>
        </div>

        <div className="joinField">
          <label>
            주소 <em>*</em>
          </label>
          <div className="joinInputRow">
            <input type="text" placeholder="우편번호" value={info.post} readOnly required />
            <button type="button" onClick={openPostcode}>
              <span className="buttonText">우편번호 찾기</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="기본 주소"
            value={info.address1}
            onChange={(e) => updateInfo('address1', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="상세 주소 입력"
            value={info.address2}
            onChange={(e) => updateInfo('address2', e.target.value)}
          />
        </div>

        {error && <p className="formError">{error}</p>}
        {success && <p className="findResult">{success}</p>}

        <button className="joinNextButton" type="submit" disabled={submitting}>
          <span className="buttonText">{submitting ? '저장 중...' : '저장'}</span>
        </button>
      </form>
    </div>
  )
}
