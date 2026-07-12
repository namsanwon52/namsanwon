import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/hash'
import { createMemberSessionToken, MEMBER_COOKIE_NAME, MEMBER_COOKIE_MAX_AGE } from '@/lib/memberSession'

export async function POST(req: NextRequest) {
  const { id, password } = await req.json()

  if (!id?.trim() || !password) {
    return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.findUnique({ where: { id } })
  if (!member) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }
  if (!member.passwd) {
    return NextResponse.json(
      { error: '비밀번호가 설정되지 않은 계정입니다. 비밀번호 재설정을 이용해주세요.' },
      { status: 401 },
    )
  }

  const valid = await verifyPassword(password, member.passwd)
  if (!valid) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const token = createMemberSessionToken({ idx: member.idx, id: member.id, name: member.name ?? '' })
  const res = NextResponse.json({ id: member.id, name: member.name })
  res.cookies.set(MEMBER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MEMBER_COOKIE_MAX_AGE,
  })
  return res
}
