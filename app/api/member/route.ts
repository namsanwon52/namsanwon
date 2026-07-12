import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'

const ID_RE = /^[a-zA-Z0-9]{3,12}$/
const PASSWORD_RE = /^[A-Za-z0-9]{4,12}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    id,
    password,
    passwordConfirm,
    name,
    tphone,
    hphone,
    email,
    smsConsent,
    emailConsent,
    post,
    address1,
    address2,
  } = body

  if (!ID_RE.test(id ?? '')) {
    return NextResponse.json({ error: '아이디는 영문/숫자 3~12자여야 합니다.' }, { status: 400 })
  }
  if (!PASSWORD_RE.test(password ?? '')) {
    return NextResponse.json(
      { error: '비밀번호는 특수문자·한글 없이 4~12자여야 합니다.' },
      { status: 400 },
    )
  }
  if (password !== passwordConfirm) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }
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

  const existing = await prisma.member.findUnique({ where: { id } })
  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
  }

  const passwd = await hashPassword(password)

  const member = await prisma.member.create({
    data: {
      id,
      passwd,
      name,
      tphone: tphone || null,
      hphone,
      email,
      resms: smsConsent ? 'Y' : 'N',
      reemail: emailConsent ? 'Y' : 'N',
      post,
      address1,
      address2: address2 || null,
      wdate: new Date(),
    },
    select: { idx: true, id: true, name: true },
  })

  return NextResponse.json(member, { status: 201 })
}
