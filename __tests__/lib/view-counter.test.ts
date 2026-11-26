const afterMock = jest.fn()
const executeRaw = jest.fn()
jest.mock('next/server', () => ({ after: (fn: () => unknown) => afterMock(fn) }))
jest.mock('@/lib/prisma', () => ({ prisma: { $executeRaw: (...a: unknown[]) => executeRaw(...a) } }))

import {
  countView,
  flushViews,
  shouldFlush,
  _viewCounterState,
  FLUSH_INTERVAL_MS,
  FLUSH_MAX_PENDING,
} from '@/lib/view-counter'

const state = _viewCounterState()

beforeEach(() => {
  afterMock.mockReset()
  executeRaw.mockReset().mockResolvedValue(1)
  state.pending.clear()
  state.total = 0
  state.flushing = false
  state.lastFlush = Date.now()
})

describe('view-counter', () => {
  it('조회는 메모리에만 쌓이고 바로 DB에 쓰지 않는다', () => {
    countView(10)
    countView(10)
    countView(11)
    expect(state.pending.get(10)).toBe(2)
    expect(state.pending.get(11)).toBe(1)
    expect(afterMock).not.toHaveBeenCalled()
    expect(executeRaw).not.toHaveBeenCalled()
  })

  it('잘못된 id는 무시한다', () => {
    countView(NaN)
    countView(-1)
    expect(state.total).toBe(0)
  })

  it('반영 간격이 지나면 응답 후 반영을 예약한다', () => {
    state.lastFlush = Date.now() - FLUSH_INTERVAL_MS - 1
    countView(10)
    expect(afterMock).toHaveBeenCalledTimes(1)
  })

  it('쌓인 조회가 한도에 닿으면 반영을 예약한다', () => {
    for (let i = 0; i < FLUSH_MAX_PENDING; i++) countView(1 + (i % 5))
    expect(afterMock).toHaveBeenCalledTimes(1)
  })

  it('반영은 쿼리 1번이고 버퍼를 비운다', async () => {
    countView(10)
    countView(11)
    await flushViews()
    expect(executeRaw).toHaveBeenCalledTimes(1)
    expect(state.pending.size).toBe(0)
    expect(state.total).toBe(0)
  })

  it('반영이 실패하면 조회수를 되돌려 놓는다', async () => {
    executeRaw.mockRejectedValueOnce(new Error('db down'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    countView(10)
    countView(10)
    await flushViews()
    expect(state.pending.get(10)).toBe(2)
    expect(state.total).toBe(2)
  })

  it('쌓인 조회가 없으면 반영하지 않는다', () => {
    state.lastFlush = 0
    expect(shouldFlush(Date.now())).toBe(false)
  })
})
