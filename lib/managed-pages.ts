import { BOARD_META, BOARD_SECTIONS, findBoardContext } from './board'

// 관리자가 블럭 단위(콘텐츠 블럭/배너 이미지)로 편집하는 모든 페이지 목록.
// slug: ContentBlock.page / 공개 라우트 publicPath / parent: 공개 사이트 상위 메뉴(PageBanner의 crumbs 첫 번째 항목과 동일)
// type: 'content'는 기존 소개/후원 페이지(콘텐츠 블럭+배너 이미지 모두 사용 가능),
//       'board'는 게시판 목록 상단 서브 배너(배너 이미지 1개만 사용, lib/board.ts와 자동 동기화)
export type ManagedPage = { slug: string; title: string; publicPath: string; parent: string; type: 'content' | 'board' }

const CONTENT_PAGES: ManagedPage[] = [
  { slug: 'greeting', title: '인사말', publicPath: '/about/greeting', parent: '남산원소개', type: 'content' },
  { slug: 'history', title: '연혁', publicPath: '/about/history', parent: '남산원소개', type: 'content' },
  { slug: 'status', title: '현황', publicPath: '/about/status', parent: '남산원소개', type: 'content' },
  { slug: 'facility', title: '시설안내', publicPath: '/about/facility', parent: '남산원소개', type: 'content' },
  { slug: 'directions', title: '오시는 길', publicPath: '/about/directions', parent: '남산원소개', type: 'content' },
  { slug: 'donation', title: '후원신청 안내', publicPath: '/support/donation', parent: '후원/자원봉사', type: 'content' },
  { slug: 'volunteer', title: '자원봉사 안내', publicPath: '/support/volunteer', parent: '후원/자원봉사', type: 'content' },
]

// 홈페이지 메인 메뉴 순서(남산원 → 사업소개 → 아동생활 → 커뮤니티)와 동일하게 정렬.
// 어느 섹션에도 속하지 않은 게시판(liv2 등)은 맨 뒤에 붙인다.
const orderedCodes: string[] = []
for (const section of BOARD_SECTIONS) {
  for (const item of section.localNav) {
    if (item.subTabs) {
      for (const tab of item.subTabs) {
        if (BOARD_META[tab.code]) orderedCodes.push(tab.code)
      }
    } else if (BOARD_META[item.code]) {
      orderedCodes.push(item.code)
    }
  }
}
const coveredCodes = new Set(orderedCodes)
for (const code of Object.keys(BOARD_META)) {
  if (!coveredCodes.has(code)) orderedCodes.push(code)
}

const BOARD_PAGES: ManagedPage[] = orderedCodes.map((code) => ({
  slug: code,
  title: BOARD_META[code].label,
  publicPath: `/board/${code}`,
  parent: findBoardContext(code)?.section.title ?? '기타',
  type: 'board' as const,
}))

export const MANAGED_PAGES: ManagedPage[] = [...CONTENT_PAGES, ...BOARD_PAGES]

export function getManagedPage(slug: string): ManagedPage | undefined {
  return MANAGED_PAGES.find((p) => p.slug === slug)
}
