import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret'

export type ResetTokenStage = 'pending' | 'verified'

export type ResetTokenPayload = {
  memberIdx: number
  codeId: number
  stage: ResetTokenStage
  exp: number
}

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(`reset:${data}`).digest('hex')
}

export function createResetToken(
  payload: Omit<ResetTokenPayload, 'exp'>,
  ttlSec: number,
): string {
  const full: ResetTokenPayload = { ...payload, exp: Date.now() + ttlSec * 1000 }
  const data = Buffer.from(JSON.stringify(full)).toString('base64url')
  return `${data}.${sign(data)}`
}

export function verifyResetToken(
  token: string | undefined | null,
  expectedStage: ResetTokenStage,
): ResetTokenPayload | null {
  if (!token) return null
  const [data, sig] = token.split('.')
  if (!data || !sig || sign(data) !== sig) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as ResetTokenPayload
    if (payload.stage !== expectedStage) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
