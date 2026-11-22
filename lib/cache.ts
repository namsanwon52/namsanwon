import { unstable_cache, revalidateTag } from 'next/cache'

/**
 * 공개 화면의 DB 조회 결과를 Vercel Data Cache에 저장한다.
 *
 * 공개 레이아웃이 회원 쿠키를 읽어 모든 공개 페이지가 매 요청 렌더링되므로 페이지 단위 캐시
 * (`export const revalidate`)는 동작하지 않는다. 대신 조회 결과를 태그와 함께 캐시하고,
 * 관리자 수정 API가 해당 태그를 즉시 무효화한다. (2026-11 크롤러로 DB 사용량 한도 초과 대응)
 *
 * 주의: 캐시된 함수 안에서는 쿠키·세션을 읽지 말 것. 권한 확인은 호출하는 쪽에서 한다.
 * DB를 직접 수정하는 이관 스크립트 실행 후에는 최대 REVALIDATE_SECONDS 동안 이전 데이터가 보일 수 있다.
 */
export const CACHE_TAGS = {
  posts: 'posts', // 게시글·첨부·댓글
  slider: 'slider',
  contentBlocks: 'content-blocks',
  history: 'history',
  facility: 'facility',
  donation: 'donation',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

const REVALIDATE_SECONDS = 60 * 60

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

/** 캐시는 JSON으로 저장되어 Date가 문자열로 돌아오므로 다시 Date로 되돌린다. */
export function reviveDates<T>(value: T): T {
  if (typeof value === 'string') {
    return (ISO_DATE_RE.test(value) ? new Date(value) : value) as T
  }
  if (Array.isArray(value)) return value.map(reviveDates) as T
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = reviveDates(v)
    return out as T
  }
  return value
}

/**
 * 조회 함수를 캐시한다. 캐시 키는 `key`와 함수 인자로 정해지므로,
 * 조회 조건은 반드시 인자로 넘기고 바깥 변수를 클로저로 참조하지 않는다.
 */
export function cachedQuery<A extends unknown[], R>(
  key: string,
  tags: CacheTag[],
  fn: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  const cached = unstable_cache(fn, [key], { tags, revalidate: REVALIDATE_SECONDS })
  return async (...args: A) => reviveDates(await cached(...args))
}

/** 데이터 변경 후 호출. 다음 요청부터 바로 새 데이터를 읽는다. */
export function invalidateCache(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
}
