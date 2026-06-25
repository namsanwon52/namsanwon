// 화면목록(IA) 기반 전체 메뉴 구조 — 5개 대분류
export type MenuItem = { label: string; href: string }
export type MenuGroup = { label: string; items: MenuItem[] }

export const MENU: MenuGroup[] = [
  {
    label: '남산원소개',
    items: [
      { label: '인사말', href: '/about/greeting' },
      { label: '연혁', href: '/about/history' },
      { label: '현황', href: '/about/status' },
      { label: '시설안내', href: '/about/facility' },
      { label: '오시는 길', href: '/about/directions' },
      { label: '남산원 역사사진', href: '/about/photos' },
    ],
  },
  {
    label: '사업소개',
    items: [
      { label: '행정지원팀', href: '/business/admin-support/donation' },
      { label: '자립지원팀', href: '/business/independence' },
      { label: '교육지원팀', href: '/business/child-support/education' },
      { label: '보육지원팀', href: '/business/child-support/care' },
    ],
  },
  {
    label: '후원/자원봉사',
    items: [
      { label: '후원신청 안내', href: '/support/donation' },
      { label: '자원봉사신청 안내', href: '/support/volunteer' },
    ],
  },
  {
    label: '아동생활',
    items: [
      { label: '아동생활', href: '/board/liv1' },
      { label: '학교생활', href: '/board/dus3' },
    ],
  },
  {
    label: '커뮤니티',
    items: [
      { label: '공지사항', href: '/board/nt1' },
      { label: '자유게시판', href: '/board/com1' },
      { label: '갤러리', href: '/board/com3' },
    ],
  },
]
