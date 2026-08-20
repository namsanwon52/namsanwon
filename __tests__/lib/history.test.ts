import { groupEntriesByYear, parseHistoryInput, formatMonthLabel } from '@/lib/history'

const entry = (id: number, year: number, month: number | null, day: number | null = null, order = 0) => ({
  id,
  year,
  month,
  day,
  order,
  content: `entry-${id}`,
})

describe('groupEntriesByYear', () => {
  it('연도는 최신순, 같은 연도 안에서는 월 오름차순으로 정렬한다', () => {
    const groups = groupEntriesByYear([entry(1, 2024, 5), entry(2, 2025, 8), entry(3, 2024, 2)])

    expect(groups.map((g) => g.year)).toEqual([2025, 2024])
    expect(groups[1].entries.map((e) => e.month)).toEqual([2, 5])
  })

  it('같은 월이면 일 오름차순, 일도 같으면 order 순으로 정렬한다', () => {
    const groups = groupEntriesByYear([
      entry(1, 2020, 3, 20),
      entry(2, 2020, 3, 5),
      entry(3, 2020, 3, 5, -1),
    ])

    expect(groups[0].entries.map((e) => e.id)).toEqual([3, 2, 1])
  })

  it('월이 없는 항목은 해당 연도의 맨 앞에 둔다', () => {
    const groups = groupEntriesByYear([entry(1, 1952, 4), entry(2, 1952, null)])

    expect(groups[0].entries.map((e) => e.id)).toEqual([2, 1])
  })
})

describe('parseHistoryInput', () => {
  it('정상 입력을 파싱한다', () => {
    const result = parseHistoryInput({ year: '2025', month: '8', day: '', content: '  평가 A등급  ' })

    expect(result).toEqual({ data: { year: 2025, month: 8, day: null, content: '평가 A등급', order: 0 } })
  })

  it('연도/월/일/내용이 잘못되면 에러 메시지를 돌려준다', () => {
    expect(parseHistoryInput({ year: 'abc', content: 'x' })).toHaveProperty('error')
    expect(parseHistoryInput({ year: 2025, month: 13, content: 'x' })).toHaveProperty('error')
    expect(parseHistoryInput({ year: 2025, month: 1, day: 32, content: 'x' })).toHaveProperty('error')
    expect(parseHistoryInput({ year: 2025, month: 1, content: '   ' })).toHaveProperty('error')
  })

  it('월 없이 일만 입력하면 거부한다', () => {
    expect(parseHistoryInput({ year: 2025, day: 3, content: 'x' })).toHaveProperty('error')
  })
})

describe('formatMonthLabel', () => {
  it('월만 있으면 월, 일까지 있으면 월/일을 표기한다', () => {
    expect(formatMonthLabel(3, null)).toBe('3월')
    expect(formatMonthLabel(3, 1)).toBe('3월 1일')
    expect(formatMonthLabel(null, null)).toBe('')
  })
})
