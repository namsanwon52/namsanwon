/**
 * 게시글 조회수를 서버 메모리에 모았다가 한 번에 DB에 반영한다.
 *
 * Neon(무료 플랜 월 100 CU-시간)은 마지막 쿼리 후 5분간 요청이 없어야 잠든다.
 * 글을 볼 때마다 조회수를 바로 쓰면 방문이 이어지는 동안 DB가 계속 깨어 있어
 * 사용 시간이 한도를 넘는다(2026-11 기준 하루의 약 80%가 활성). 그래서
 * - 조회는 메모리에만 더하고
 * - FLUSH_INTERVAL_MS가 지났거나 쌓인 조회가 FLUSH_MAX_PENDING을 넘으면
 *   응답을 보낸 뒤(after) 쿼리 1번으로 몰아서 반영한다.
 *
 * 감수하는 점
 * - 화면의 조회수는 최대 FLUSH_INTERVAL_MS(+ 게시글 캐시 1시간)만큼 늦게 오른다.
 * - 서버 인스턴스가 반영 전에 종료되면 그동안 모인 조회수는 사라진다.
 * - 서버 인스턴스마다 따로 모은다(인스턴스 수만큼 반영 쿼리가 나뉨).
 */
import { after } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export const FLUSH_INTERVAL_MS = 30 * 60 * 1000
export const FLUSH_MAX_PENDING = 300

type State = { pending: Map<number, number>; total: number; lastFlush: number; flushing: boolean }

// 개발 서버의 모듈 재로딩에도 값이 유지되도록 globalThis에 둔다.
const g = globalThis as unknown as { __viewCounter?: State }
const state: State = (g.__viewCounter ??= {
  pending: new Map(),
  total: 0,
  lastFlush: Date.now(),
  flushing: false,
})

/** 조회 1회 기록. 반영 시점이 되면 응답 후 DB 반영을 예약한다. */
export function countView(postId: number) {
  if (!Number.isInteger(postId) || postId <= 0) return
  state.pending.set(postId, (state.pending.get(postId) ?? 0) + 1)
  state.total += 1
  if (shouldFlush(Date.now())) {
    state.lastFlush = Date.now()
    after(flushViews)
  }
}

export function shouldFlush(now: number): boolean {
  if (state.flushing || state.total === 0) return false
  return now - state.lastFlush >= FLUSH_INTERVAL_MS || state.total >= FLUSH_MAX_PENDING
}

/** 모인 조회수를 UPDATE 1번으로 반영. 실패하면 다음 반영 때 다시 시도하도록 되돌려 놓는다. */
export async function flushViews() {
  if (state.flushing || state.pending.size === 0) return
  state.flushing = true
  const entries = [...state.pending]
  state.pending.clear()
  state.total = 0
  try {
    const values = Prisma.join(entries.map(([id, n]) => Prisma.sql`(${id}::int, ${n}::int)`))
    // updatedAt은 건드리지 않는다(조회는 글 수정이 아님)
    await prisma.$executeRaw`
      UPDATE "Post" AS p SET views = p.views + v.n
      FROM (VALUES ${values}) AS v(id, n)
      WHERE p.id = v.id`
  } catch (e) {
    for (const [id, n] of entries) state.pending.set(id, (state.pending.get(id) ?? 0) + n)
    state.total += entries.reduce((s, [, n]) => s + n, 0)
    console.error('[view-counter] flush failed', e)
  } finally {
    state.flushing = false
  }
}

/** 테스트용 */
export function _viewCounterState() {
  return state
}
