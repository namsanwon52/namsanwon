import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret'

export const MEMBER_COOKIE_NAME = 'member_session'
export const MEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30일

export type MemberSessionPayload = { idx: number; id: string; name: string }

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex')
}

export function createMemberSessionToken(payload: MemberSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${data}.${sign(data)}`
}

export function verifyMemberSessionToken(token: string | undefined | null): MemberSessionPayload | null {
  if (!token) return null
  const [data, sig] = token.split('.')
  if (!data || !sig || sign(data) !== sig) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString())
  } catch {
    return null
  }
}

export async function getMemberSession(): Promise<MemberSessionPayload | null> {
  const store = await cookies()
  return verifyMemberSessionToken(store.get(MEMBER_COOKIE_NAME)?.value)
}
