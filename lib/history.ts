// 연혁(HistoryEntry) 공용 로직: 정렬/그룹핑/입력값 검증.
// 관리자 API와 공개 타임라인이 같은 규칙을 쓰도록 여기 모아둔다.

export type HistoryEntryLike = {
  id: number
  year: number
  month: number | null
  day: number | null
  content: string
  order: number
}

export type HistoryYearGroup<T extends HistoryEntryLike = HistoryEntryLike> = {
  year: number
  entries: T[]
}

// 공개 타임라인 정렬: 연도는 최신순, 같은 연도 안에서는 월/일 오름차순(월 미상은 맨 앞).
export function groupEntriesByYear<T extends HistoryEntryLike>(entries: T[]): HistoryYearGroup<T>[] {
  const byYear = new Map<number, T[]>()

  for (const entry of entries) {
    const bucket = byYear.get(entry.year)
    if (bucket) bucket.push(entry)
    else byYear.set(entry.year, [entry])
  }

  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({
      year,
      entries: [...list].sort(
        (a, b) =>
          (a.month ?? 0) - (b.month ?? 0) ||
          (a.day ?? 0) - (b.day ?? 0) ||
          a.order - b.order ||
          a.id - b.id
      ),
    }))
}

export type HistoryInput = {
  year: number
  month: number | null
  day: number | null
  content: string
  order: number
  active?: boolean
}

// 관리자 입력값 검증. 잘못된 값이면 사용자에게 보여줄 메시지를 error로 돌려준다.
export function parseHistoryInput(body: unknown): { data: HistoryInput } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: '잘못된 요청입니다.' }
  const raw = body as Record<string, unknown>

  const year = Number(raw.year)
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    return { error: '연도는 1900~2200 사이의 숫자로 입력해 주세요.' }
  }

  let month: number | null = null
  if (raw.month !== null && raw.month !== undefined && raw.month !== '') {
    month = Number(raw.month)
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return { error: '월은 1~12 사이의 숫자로 입력해 주세요.' }
    }
  }

  let day: number | null = null
  if (raw.day !== null && raw.day !== undefined && raw.day !== '') {
    day = Number(raw.day)
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return { error: '일은 1~31 사이의 숫자로 입력해 주세요.' }
    }
    if (month === null) return { error: '일을 입력하려면 월도 함께 선택해 주세요.' }
  }

  const content = typeof raw.content === 'string' ? raw.content.trim() : ''
  if (!content) return { error: '내용을 입력해 주세요.' }
  if (content.length > 500) return { error: '내용은 500자 이내로 입력해 주세요.' }

  const order = raw.order === undefined || raw.order === null || raw.order === '' ? 0 : Number(raw.order)
  if (!Number.isInteger(order)) return { error: '순서는 숫자로 입력해 주세요.' }

  const data: HistoryInput = { year, month, day, content, order }
  if (typeof raw.active === 'boolean') data.active = raw.active
  return { data }
}

// 타임라인 왼쪽 라벨: 월만 있으면 '3월', 일까지 있으면 '3월 1일'.
export function formatMonthLabel(month: number | null, day: number | null): string {
  if (month === null) return ''
  return day === null ? `${month}월` : `${month}월 ${day}일`
}
