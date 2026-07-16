// 관리자가 블럭 단위(콘텐츠 블럭/배너 이미지)로 편집하는 모든 페이지 목록.
// slug: ContentBlock.page / 공개 라우트 publicPath / parent: 공개 사이트 상위 메뉴(PageBanner의 crumbs 첫 번째 항목과 동일)
export type ManagedPage = { slug: string; title: string; publicPath: string; parent: string }

export const MANAGED_PAGES: ManagedPage[] = [
  { slug: 'greeting', title: '인사말', publicPath: '/about/greeting', parent: '남산원소개' },
  { slug: 'history', title: '연혁', publicPath: '/about/history', parent: '남산원소개' },
  { slug: 'status', title: '현황', publicPath: '/about/status', parent: '남산원소개' },
  { slug: 'facility', title: '시설안내', publicPath: '/about/facility', parent: '남산원소개' },
  { slug: 'directions', title: '오시는 길', publicPath: '/about/directions', parent: '남산원소개' },
  { slug: 'donation', title: '후원신청 안내', publicPath: '/support/donation', parent: '후원/자원봉사' },
  { slug: 'volunteer', title: '자원봉사 안내', publicPath: '/support/volunteer', parent: '후원/자원봉사' },
]

export function getManagedPage(slug: string): ManagedPage | undefined {
  return MANAGED_PAGES.find((p) => p.slug === slug)
}
