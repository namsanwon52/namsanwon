// 남산원소개 하위 관리 대상 소개 페이지 (WYSIWYG 편집)
// slug: PageContent.slug / 공개 라우트 /about/<route>
export type AboutPage = { slug: string; title: string; route: string }

export const ABOUT_PAGES: AboutPage[] = [
  { slug: 'greeting', title: '인사말', route: 'greeting' },
  { slug: 'history', title: '연혁', route: 'history' },
  { slug: 'status', title: '현황', route: 'status' },
  { slug: 'facility', title: '시설안내', route: 'facility' },
  { slug: 'directions', title: '오시는 길', route: 'directions' },
]

export function getAboutPage(slug: string): AboutPage | undefined {
  return ABOUT_PAGES.find((p) => p.slug === slug)
}
