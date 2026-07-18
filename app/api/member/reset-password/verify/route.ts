import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createResetToken, verifyResetToken } from '@/lib/resetToken'

const MAX_ATTEMPTS = 5
const VERIFIED_TOKEN_TTL_SEC = 10 * 60

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  const { resetToken, code } = await req.json()

  const payload = verifyResetToken(resetToken, 'pending')
  if (!payload) {
    return NextResponse.json({ error: '인증 요청이 만료되었습니다. 다시 시도해주세요.' }, { status: 400 })
  }

  const resetCode = await prisma.passwordResetCode.findUnique({ where: { id: payload.codeId } })
  if (
    !resetCode ||
    resetCode.memberIdx !== payload.memberIdx ||
    resetCode.consumed ||
    resetCode.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, { status: 400 })
  }
  if (resetCode.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: '시도 횟수를 초과했습니다. 다시 요청해주세요.' }, { status: 429 })
  }

  if (!code?.trim() || hashCode(code) !== resetCode.codeHash) {
    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { attempts: { increment: 1 } },
    })
    const remaining = MAX_ATTEMPTS - (resetCode.attempts + 1)
    return NextResponse.json(
      { error: `인증번호가 일치하지 않습니다. (남은 시도 ${Math.max(remaining, 0)}회)` },
      { status: 400 },
    )
  }

  await prisma.passwordResetCode.update({
    where: { id: resetCode.id },
    data: { verified: true },
  })

  const verifiedToken = createResetToken(
    { memberIdx: payload.memberIdx, codeId: resetCode.id, stage: 'verified' },
    VERIFIED_TOKEN_TTL_SEC,
  )

  return NextResponse.json({ resetToken: verifiedToken })
}
