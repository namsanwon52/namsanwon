import { MANAGED_PAGES } from '@/lib/managed-pages'

describe('managed page registry', () => {
  it('게시판이 아닌 페이지는 board 타입으로 등록되지 않는다', () => {
    expect(MANAGED_PAGES.some((p) => p.slug === 'greeting' && p.type === 'board')).toBe(false)
    expect(MANAGED_PAGES.some((p) => p.slug === 'nt1' && p.type === 'board')).toBe(true)
  })
})
