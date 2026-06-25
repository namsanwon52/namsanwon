// 크롤링 데이터의 code 값을 게시판 카테고리로 직접 사용
export const BOARD_META: Record<string, { label: string; adminOnly: boolean }> = {
  nt1:  { label: '공지사항',   adminOnly: true },
  nt2:  { label: '예산공고',   adminOnly: true },
  nt3:  { label: '결산공고',   adminOnly: true },
  nt4:  { label: '법인게시판', adminOnly: true },
  com1: { label: '자유게시판', adminOnly: false },
  com3: { label: '갤러리',     adminOnly: true },
  liv1: { label: '아동생활',   adminOnly: true },
  liv2: { label: '영아방',     adminOnly: true },
  dus3: { label: '학교생활',   adminOnly: true },
}

export function getBoardMeta(category: string) {
  return BOARD_META[category] ?? { label: '게시판', adminOnly: false }
}

// ── 화면목록(IA) 기반 게시판 섹션 구조 ──
// 대분류(섹션) → 로컬탭(localNav) → (옵션)서브탭(subTabs)
export type BoardSubTab = { label: string; code: string }
export type BoardLocalItem = {
  label: string
  code: string // 대표 code (해당 로컬탭 클릭 시 이동)
  type: 'list' | 'gallery'
  subTabs?: BoardSubTab[]
}
export type BoardSection = {
  key: string
  title: string
  desc: string
  localNav: BoardLocalItem[]
}

export const BOARD_SECTIONS: BoardSection[] = [
  {
    key: 'community',
    title: '커뮤니티',
    desc: '남산원의 주요 소식과 공지사항, 활동 현황을 안내해 드립니다.',
    localNav: [
      {
        label: '공지사항',
        code: 'nt1',
        type: 'list',
        subTabs: [
          { label: '공지사항', code: 'nt1' },
          { label: '예산', code: 'nt2' },
          { label: '결산', code: 'nt3' },
          { label: '법인', code: 'nt4' },
        ],
      },
      { label: '자유게시판', code: 'com1', type: 'list' },
      { label: '갤러리', code: 'com3', type: 'gallery' },
    ],
  },
  {
    key: 'children',
    title: '아동생활',
    desc: '남산원 아이들의 건강하고 행복한 일상을 전해 드립니다.',
    localNav: [
      { label: '아동생활', code: 'liv1', type: 'list' },
      { label: '학교생활', code: 'dus3', type: 'list' },
    ],
  },
]

export type BoardContext = {
  section: BoardSection
  localItem: BoardLocalItem
  /** 현재 code가 서브탭 중 하나인지 */
  activeCode: string
}

/** code로 소속 섹션 / 로컬탭을 역추적 */
export function findBoardContext(code: string): BoardContext | null {
  for (const section of BOARD_SECTIONS) {
    for (const localItem of section.localNav) {
      if (localItem.code === code) return { section, localItem, activeCode: code }
      if (localItem.subTabs?.some((t) => t.code === code)) {
        return { section, localItem, activeCode: code }
      }
    }
  }
  return null
}
