import { hashPassword, verifyPassword } from '@/lib/hash'

describe('hashPassword', () => {
  it('비밀번호를 bcrypt 해시로 변환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(hash).not.toBe('test1234')
    expect(hash).toMatch(/^\$2[ab]\$/)
  })
})

describe('verifyPassword', () => {
  it('올바른 비밀번호는 true를 반환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(await verifyPassword('test1234', hash)).toBe(true)
  })

  it('잘못된 비밀번호는 false를 반환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})
