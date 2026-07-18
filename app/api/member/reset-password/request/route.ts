import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/resetToken'
import { sendPasswordResetCodeEmail } from '@/lib/mail'

const CODE_TTL_SEC = 5 * 60
const RESEND_COOLDOWN_SEC = 60
const PENDING_TOKEN_TTL_SEC = 10 * 60

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  const { id, name, email } = await req.json()

  if (!id?.trim() || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: '아이디, 이름, 이메일을 모두 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({ where: { id, name, email } })
  if (!member) {
    return NextResponse.json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' }, { status: 404 })
  }
  if (!member.email) {
    return NextResponse.json({ error: '등록된 이메일이 없습니다.' }, { status: 400 })
  }

  const recent = await prisma.passwordResetCode.findFirst({
    where: { memberIdx: member.idx },
    orderBy: { createdAt: 'desc' },
  })
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SEC * 1000) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  const resetCode = await prisma.passwordResetCode.create({
    data: {
      memberIdx: member.idx,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_SEC * 1000),
    },
  })

  await sendPasswordResetCodeEmail(member.email, code)

  const resetToken = createResetToken(
    { memberIdx: member.idx, codeId: resetCode.id, stage: 'pending' },
    PENDING_TOKEN_TTL_SEC,
  )

  return NextResponse.json({ resetToken })
}
