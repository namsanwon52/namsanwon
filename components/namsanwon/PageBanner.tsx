'use client'

import { usePathname } from 'next/navigation'
import { findBoardContext } from '@/lib/board'

// 대분류(상단 메뉴)별 배너 이미지. 페이지 주소로 대분류를 판단한다.
const BANNERS: Record<string, string> = {
  namsanwon: '/namsanwon/banner-namsanwon.webp',
  business: '/namsanwon/banner-business.webp',
  support: '/namsanwon/banner-support.webp',
  children: '/namsanwon/banner-children.webp',
  community: '/namsanwon/banner-community.webp',
  default: '/namsanwon/banner-default.webp',
}

function sectionKeyOf(pathname: string): string {
  const board = pathname.match(/^\/board\/([^/]+)/)
  if (board) return findBoardContext(board[1])?.section.key ?? 'default'
  if (pathname.startsWith('/about')) return 'namsanwon'
  if (pathname.startsWith('/business')) return 'business'
  if (pathname.startsWith('/support')) return 'support'
  if (pathname.startsWith('/story/news')) return 'children' // 아동 소식(liv1)
  if (pathname.startsWith('/story/album') || pathname.startsWith('/corporation')) return 'community'
  return 'default'
}

export default function PageBanner({
  title,
  desc,
}: {
  title: string
  desc?: string
  /** @deprecated 위치 표시는 PageTitle에서 한다 (호환용으로 남겨둠) */
  crumbs?: string[]
}) {
  const pathname = usePathname() ?? ''
  const image = BANNERS[sectionKeyOf(pathname)] ?? BANNERS.default

  return (
    <section className="pageBanner" style={{ backgroundImage: `url("${image}")` }}>
      <div className="pageBannerInner">
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
    </section>
  )
}
