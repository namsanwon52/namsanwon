import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import MemberPageHead from '@/components/member/MemberPageHead'
import MyInfoForm from '@/components/member/MyInfoForm'
import { getMemberSession } from '@/lib/memberSession'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: '개인정보변경' }

export default async function MyPage() {
  const session = await getMemberSession()
  if (!session) redirect('/member/login')

  const member = await prisma.member.findUnique({
    where: { idx: session.idx },
    select: {
      id: true,
      name: true,
      tphone: true,
      hphone: true,
      email: true,
      post: true,
      address1: true,
      address2: true,
      resms: true,
      reemail: true,
    },
  })
  if (!member) redirect('/member/login')

  return (
    <>
      <MemberPageHead title="개인정보변경" crumbs={['개인정보변경']} />
      <MyInfoForm
        initial={{
          id: member.id,
          name: member.name ?? '',
          tphone: member.tphone ?? '',
          hphone: member.hphone ?? '',
          email: member.email ?? '',
          post: member.post ?? '',
          address1: member.address1 ?? '',
          address2: member.address2 ?? '',
          smsConsent: member.resms === 'Y',
          emailConsent: member.reemail === 'Y',
        }}
      />
    </>
  )
}
