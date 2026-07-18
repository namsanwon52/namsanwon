import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'
import { verifyResetToken } from '@/lib/resetToken'

const PASSWORD_RE = /^[A-Za-z0-9]{4,12}$/

export async function POST(req: NextRequest) {
  const { resetToken, newPassword, newPasswordConfirm } = await req.json()

  const payload = verifyResetToken(resetToken, 'verified')
  if (!payload) {
    return NextResponse.json({ error: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.' }, { status: 400 })
  }

  if (!PASSWORD_RE.test(newPassword ?? '')) {
    return NextResponse.json(
      { error: '비밀번호는 특수문자·한글 없이 4~12자여야 합니다.' },
      { status: 400 },
    )
  }
  if (newPassword !== newPasswordConfirm) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  const resetCode = await prisma.passwordResetCode.findUnique({ where: { id: payload.codeId } })
  if (
    !resetCode ||
    resetCode.memberIdx !== payload.memberIdx ||
    !resetCode.verified ||
    resetCode.consumed ||
    resetCode.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.' }, { status: 400 })
  }

  const passwd = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.member.update({ where: { idx: payload.memberIdx }, data: { passwd } }),
    prisma.passwordResetCode.update({ where: { id: resetCode.id }, data: { consumed: true } }),
  ])

  return NextResponse.json({ ok: true })
}
