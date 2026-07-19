import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import MemberPageHead from '@/components/member/MemberPageHead'
import ChangePasswordForm from '@/components/member/ChangePasswordForm'
import { getMemberSession } from '@/lib/memberSession'

export const metadata: Metadata = { title: '비밀번호 변경' }

export default async function ChangePasswordPage() {
  const session = await getMemberSession()
  if (!session) redirect('/member/login')

  return (
    <>
      <MemberPageHead title="비밀번호 변경" crumbs={['비밀번호 변경']} />
      <ChangePasswordForm />
    </>
  )
}
