import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: '이름과 이메일을 입력해주세요.' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({ where: { name, email } })
  if (!member) {
    return NextResponse.json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ id: member.id })
}
