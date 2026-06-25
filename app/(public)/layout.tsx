import './namsanwon-theme.css'
import SiteHeader from '@/components/namsanwon/SiteHeader'
import SiteFooter from '@/components/namsanwon/SiteFooter'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skipLink" href="#main">본문 바로가기</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
