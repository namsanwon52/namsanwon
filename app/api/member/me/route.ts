import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createMemberSessionToken,
  getMemberSession,
  MEMBER_COOKIE_NAME,
  MEMBER_COOKIE_MAX_AGE,
} from '@/lib/memberSession'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(req: NextRequest) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { name, tphone, hphone, email, smsConsent, emailConsent, post, address1, address2 } =
    await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!hphone?.trim()) {
    return NextResponse.json({ error: '휴대폰 번호를 입력해주세요.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email ?? '')) {
    return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  if (!post?.trim() || !address1?.trim()) {
    return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.update({
    where: { idx: session.idx },
    data: {
      name,
      tphone: tphone || null,
      hphone,
      email,
      resms: smsConsent ? 'Y' : 'N',
      reemail: emailConsent ? 'Y' : 'N',
      post,
      address1,
      address2: address2 || null,
    },
    select: { idx: true, id: true, name: true },
  })

  const token = createMemberSessionToken({ idx: member.idx, id: member.id, name: member.name ?? '' })
  const res = NextResponse.json(member)
  res.cookies.set(MEMBER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MEMBER_COOKIE_MAX_AGE,
  })
  return res
}
