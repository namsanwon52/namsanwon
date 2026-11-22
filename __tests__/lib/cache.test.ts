jest.mock('next/cache', () => ({ unstable_cache: jest.fn(), revalidateTag: jest.fn() }))

import { reviveDates } from '@/lib/cache'

describe('reviveDates', () => {
  it('JSON 직렬화로 문자열이 된 날짜를 Date로 되돌린다', () => {
    const original = {
      id: 1,
      createdAt: new Date('2026-11-20T21:00:07.971Z'),
      files: [{ url: 'https://x/y.jpg', uploadedAt: new Date('2026-01-02T03:04:05Z') }],
    }
    const restored = reviveDates(JSON.parse(JSON.stringify(original)))
    expect(restored.createdAt).toBeInstanceOf(Date)
    expect(restored.createdAt.toISOString()).toBe('2026-11-20T21:00:07.971Z')
    expect(restored.files[0].uploadedAt).toBeInstanceOf(Date)
    expect(restored.files[0].url).toBe('https://x/y.jpg')
  })

  it('튜플·null·숫자·일반 문자열은 그대로 둔다', () => {
    const value = [3, null, { title: '2026년 행사', n: 0 }, '1971년']
    expect(reviveDates(value)).toEqual(value)
  })

  it('이미 Date인 값은 그대로 둔다', () => {
    const d = new Date('2026-11-22T00:00:00Z')
    expect(reviveDates({ d }).d).toBe(d)
  })
})
