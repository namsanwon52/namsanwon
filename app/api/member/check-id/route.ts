import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')?.trim() ?? ''

  if (!/^[a-zA-Z0-9]{3,12}$/.test(id)) {
    return NextResponse.json({ error: '아이디는 영문/숫자 3~12자여야 합니다.' }, { status: 400 })
  }

  const existing = await prisma.member.findUnique({ where: { id } })
  return NextResponse.json({ available: !existing })
}
