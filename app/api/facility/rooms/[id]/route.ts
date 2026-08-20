import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { del, isManagedUrl } from '@/lib/storage'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const id = Number(idStr)
  const body = await req.json()

  const current = await prisma.facilityRoom.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: '공간을 찾을 수 없습니다.' }, { status: 404 })

  const data: {
    name?: string
    imageUrl?: string
    imageAlt?: string
    order?: number
    active?: boolean
    floorId?: number
  } = {}

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: '공간 이름을 입력해 주세요.' }, { status: 400 })
    data.name = name
  }
  if (body.imageUrl !== undefined) {
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
    if (!imageUrl) return NextResponse.json({ error: '사진을 등록해 주세요.' }, { status: 400 })
    data.imageUrl = imageUrl
  }
  if (body.imageAlt !== undefined && typeof body.imageAlt === 'string') data.imageAlt = body.imageAlt.trim()
  if (body.order !== undefined) {
    if (!Number.isInteger(body.order)) {
      return NextResponse.json({ error: '순서는 숫자로 입력해 주세요.' }, { status: 400 })
    }
    data.order = body.order
  }
  if (typeof body.active === 'boolean') data.active = body.active
  if (body.floorId !== undefined) {
    const floorId = Number(body.floorId)
    if (!Number.isInteger(floorId)) {
      return NextResponse.json({ error: '층을 선택해 주세요.' }, { status: 400 })
    }
    data.floorId = floorId
  }

  const room = await prisma.facilityRoom.update({ where: { id }, data })

  // 사진을 교체했으면 이전 파일을 정리한다.
  if (data.imageUrl && data.imageUrl !== current.imageUrl && isManagedUrl(current.imageUrl)) {
    try {
      await del(current.imageUrl)
    } catch (err) {
      console.error('스토리지 파일 삭제 실패:', err)
    }
  }

  return NextResponse.json(room)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const room = await prisma.facilityRoom.delete({ where: { id: Number(idStr) } })

  if (room.imageUrl && isManagedUrl(room.imageUrl)) {
    try {
      await del(room.imageUrl)
    } catch (err) {
      console.error('스토리지 파일 삭제 실패:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
