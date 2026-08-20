import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const floorId = Number(body.floorId)
  if (!Number.isInteger(floorId)) {
    return NextResponse.json({ error: '층을 선택해 주세요.' }, { status: 400 })
  }

  const floor = await prisma.facilityFloor.findUnique({ where: { id: floorId } })
  if (!floor) return NextResponse.json({ error: '층을 찾을 수 없습니다.' }, { status: 404 })

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: '공간 이름을 입력해 주세요.' }, { status: 400 })

  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
  if (!imageUrl) return NextResponse.json({ error: '사진을 등록해 주세요.' }, { status: 400 })

  const last = await prisma.facilityRoom.findFirst({ where: { floorId }, orderBy: { order: 'desc' } })
  const order = Number.isInteger(body.order) ? body.order : (last?.order ?? 0) + 1

  const room = await prisma.facilityRoom.create({
    data: {
      floorId,
      name,
      imageUrl,
      imageAlt: typeof body.imageAlt === 'string' && body.imageAlt.trim() ? body.imageAlt.trim() : name,
      order,
    },
  })
  return NextResponse.json(room, { status: 201 })
}
