import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/hash'
import { getMemberSession } from '@/lib/memberSession'

const PASSWORD_RE = /^[A-Za-z0-9]{4,12}$/

export async function POST(req: NextRequest) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { currentPassword, newPassword, newPasswordConfirm } = await req.json()

  if (!currentPassword) {
    return NextResponse.json({ error: '현재 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.findUnique({ where: { idx: session.idx } })
  if (!member?.passwd) {
    return NextResponse.json({ error: '계정을 확인할 수 없습니다.' }, { status: 401 })
  }

  const valid = await verifyPassword(currentPassword, member.passwd)
  if (!valid) {
    return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 })
  }

  if (!PASSWORD_RE.test(newPassword ?? '')) {
    return NextResponse.json(
      { error: '비밀번호는 특수문자·한글 없이 4~12자여야 합니다.' },
      { status: 400 },
    )
  }
  if (newPassword !== newPasswordConfirm) {
    return NextResponse.json({ error: '새 비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  const passwd = await hashPassword(newPassword)
  await prisma.member.update({ where: { idx: session.idx }, data: { passwd } })

  return NextResponse.json({ ok: true })
}
