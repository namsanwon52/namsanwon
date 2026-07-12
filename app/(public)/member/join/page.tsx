import type { Metadata } from 'next'
import MemberPageHead from '@/components/member/MemberPageHead'
import JoinWizard from '@/components/member/JoinWizard'

export const metadata: Metadata = { title: '회원가입' }

export default function JoinPage() {
  return (
    <>
      <MemberPageHead title="회원가입" crumbs={['회원가입']} />
      <JoinWizard />
    </>
  )
}
