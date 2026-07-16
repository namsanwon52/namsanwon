// 크롤링 데이터의 code 값을 게시판 카테고리로 직접 사용
export const BOARD_META: Record<string, { label: string; adminOnly: boolean }> = {
  nt1:  { label: '공지사항',   adminOnly: true },
  nt2:  { label: '예산공고',   adminOnly: true },
  nt3:  { label: '결산공고',   adminOnly: true },
  nt4:  { label: '법인게시판', adminOnly: true },
  com1: { label: '자유게시판', adminOnly: false },
  com3: { label: '갤러리',     adminOnly: true },
  com6: { label: '남산원 역사사진', adminOnly: true },
  liv1: { label: '아동생활',   adminOnly: true },
  liv2: { label: '영아방',     adminOnly: true },
  dus3: { label: '학교생활',   adminOnly: true },
  // ── 사업소개 팀별 게시판 ──
  bus1:     { label: '행정지원팀 소식', adminOnly: true },
  schedule: { label: '자원봉사 소식',   adminOnly: true },
  cus1:     { label: '후원·금품현황',   adminOnly: true },
  cus2:     { label: '홍보부 소식',     adminOnly: true },
  bus2:     { label: '위생·영양 소식',  adminOnly: true },
  bus3:     { label: '안전관리 소식',   adminOnly: true },
  bus7:     { label: '상담 소식',       adminOnly: true },
  eus1:     { label: '자립지원팀 소식', adminOnly: true },
  dus1:     { label: '교육부 소식',     adminOnly: true },
  dus2:     { label: '도서부 소식',     adminOnly: true },
  cus11:    { label: '영유아프로그램',  adminOnly: true },
  cus21:    { label: '보건 소식',       adminOnly: true },
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
    key: 'namsanwon',
    title: '남산원',
    desc: '사회복지법인 남산원의 역사와 발자취를 사진으로 소개합니다.',
    localNav: [{ label: '남산원 역사사진', code: 'com6', type: 'gallery' }],
  },
  {
    key: 'business',
    title: '사업소개',
    desc: '남산원 각 지원팀의 활동 소식과 현황을 안내해 드립니다.',
    localNav: [
      {
        label: '행정지원팀',
        code: 'bus1',
        type: 'list',
        subTabs: [
          { label: '행정지원팀 소식', code: 'bus1' },
          { label: '자원봉사 소식', code: 'schedule' },
          { label: '후원·금품현황', code: 'cus1' },
          { label: '홍보부 소식', code: 'cus2' },
          { label: '위생·영양 소식', code: 'bus2' },
          { label: '안전관리 소식', code: 'bus3' },
          { label: '상담 소식', code: 'bus7' },
        ],
      },
      { label: '자립지원팀', code: 'eus1', type: 'list' },
      {
        label: '교육지원팀',
        code: 'dus1',
        type: 'list',
        subTabs: [
          { label: '교육부 소식', code: 'dus1' },
          { label: '도서부 소식', code: 'dus2' },
        ],
      },
      {
        label: '보육지원팀',
        code: 'cus11',
        type: 'list',
        subTabs: [
          { label: '영유아프로그램', code: 'cus11' },
          { label: '보건 소식', code: 'cus21' },
        ],
      },
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

// ── 관리자 게시글 관리 화면 전용 그룹 구조 ──
// BOARD_SECTIONS의 대분류(그룹) → 팀(localNav) → 세부게시판(subTabs) 구조를 그대로 재사용.
// 공개 사이트의 BoardLocalNav와 동일한 계층을 유지해야, 팀 단위 탭(예: 교육지원팀)이 사라지지 않음.
// 어느 섹션에도 속하지 않은 게시판(liv2 등, 현재 사용하지 않는 게시판)은 "기타" 그룹으로 모음.
export type AdminBoardGroup = { key: string; title: string; items: BoardLocalItem[] }

export function getAdminBoardGroups(): AdminBoardGroup[] {
  const groups: AdminBoardGroup[] = BOARD_SECTIONS.map((section) => ({
    key: section.key,
    title: section.title,
    items: section.localNav,
  }))

  const coveredCodes = new Set(
    groups.flatMap((g) => g.items.flatMap((i) => [i.code, ...(i.subTabs?.map((t) => t.code) ?? [])]))
  )
  const etcItems: BoardLocalItem[] = Object.entries(BOARD_META)
    .filter(([code]) => !coveredCodes.has(code))
    .map(([code, meta]) => ({ label: meta.label, code, type: 'list' }))

  if (etcItems.length > 0) {
    groups.push({ key: 'etc', title: '기타', items: etcItems })
  }

  return groups
}
