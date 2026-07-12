import type { Metadata } from 'next'
import MemberPageHead from '@/components/member/MemberPageHead'
import LoginForm from '@/components/member/LoginForm'

export const metadata: Metadata = { title: '로그인' }

export default function LoginPage() {
  return (
    <>
      <MemberPageHead title="로그인" crumbs={['로그인']} />
      <LoginForm />
    </>
  )
}
