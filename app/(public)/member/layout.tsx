import MemberTabs from '@/components/member/MemberTabs'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MemberTabs />
      {children}
    </>
  )
}
