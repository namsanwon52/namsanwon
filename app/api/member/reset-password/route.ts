import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'

const TEMP_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export async function POST(req: NextRequest) {
  const { id, name, email } = await req.json()

  if (!id?.trim() || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: '아이디, 이름, 이메일을 모두 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({ where: { id, name, email } })
  if (!member) {
    return NextResponse.json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' }, { status: 404 })
  }

  const tempPassword = Array.from({ length: 10 }, () => TEMP_CHARS[crypto.randomInt(TEMP_CHARS.length)]).join('')
  await prisma.member.update({
    where: { id: member.id },
    data: { passwd: await hashPassword(tempPassword) },
  })

  return NextResponse.json({ tempPassword })
}
