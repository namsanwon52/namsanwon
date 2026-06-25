export const BOARD_META: Record<string, { label: string; adminOnly: boolean }> = {
  notice:      { label: '공지사항',         adminOnly: true },
  job:         { label: '채용공고',         adminOnly: true },
  free:        { label: '자유게시판',       adminOnly: false },
  foreign:     { label: '외국인게시판',     adminOnly: false },
  gallery:     { label: '후원·봉사 갤러리', adminOnly: true },
  corporation: { label: '법인게시판',       adminOnly: true },
}

export function getBoardMeta(category: string) {
  return BOARD_META[category] ?? { label: '게시판', adminOnly: false }
}
