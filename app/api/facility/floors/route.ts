import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const floors = await prisma.facilityFloor.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: { rooms: { orderBy: [{ order: 'asc' }, { id: 'asc' }] } },
  })
  return NextResponse.json(floors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: '층 이름을 입력해 주세요.' }, { status: 400 })

  // 순서를 지정하지 않으면 맨 뒤에 붙인다.
  const last = await prisma.facilityFloor.findFirst({ orderBy: { order: 'desc' } })
  const order = Number.isInteger(body.order) ? body.order : (last?.order ?? 0) + 1

  const floor = await prisma.facilityFloor.create({ data: { name, order } })
  return NextResponse.json(floor, { status: 201 })
}
