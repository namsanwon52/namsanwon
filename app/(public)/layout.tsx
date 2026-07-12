import './namsanwon-theme.css'
import SiteHeader from '@/components/namsanwon/SiteHeader'
import SiteFooter from '@/components/namsanwon/SiteFooter'
import { getMemberSession } from '@/lib/memberSession'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const member = await getMemberSession()

  return (
    <>
      <a className="skipLink" href="#main">본문 바로가기</a>
      <SiteHeader member={member ? { id: member.id, name: member.name } : null} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
