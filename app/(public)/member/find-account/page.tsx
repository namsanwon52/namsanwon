import type { Metadata } from 'next'
import { Suspense } from 'react'
import MemberPageHead from '@/components/member/MemberPageHead'
import FindAccountPanels from '@/components/member/FindAccountPanels'

export const metadata: Metadata = { title: '아이디/비밀번호 찾기' }

export default function FindAccountPage() {
  return (
    <>
      <MemberPageHead title="아이디/비밀번호 찾기" crumbs={['아이디/비밀번호 찾기']} />
      <Suspense>
        <FindAccountPanels />
      </Suspense>
    </>
  )
}
