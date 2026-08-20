import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { del, isManagedUrl } from '@/lib/storage'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const body = await req.json()
  const data: { name?: string; order?: number; active?: boolean } = {}

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: '층 이름을 입력해 주세요.' }, { status: 400 })
    data.name = name
  }
  if (body.order !== undefined) {
    if (!Number.isInteger(body.order)) {
      return NextResponse.json({ error: '순서는 숫자로 입력해 주세요.' }, { status: 400 })
    }
    data.order = body.order
  }
  if (typeof body.active === 'boolean') data.active = body.active

  const floor = await prisma.facilityFloor.update({ where: { id: Number(idStr) }, data })
  return NextResponse.json(floor)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { id: idStr } = await params
  const id = Number(idStr)

  // 공간은 cascade로 지워지므로, 스토리지 파일은 먼저 정리한다.
  const rooms = await prisma.facilityRoom.findMany({ where: { floorId: id } })
  await prisma.facilityFloor.delete({ where: { id } })

  const urls = rooms.map((r) => r.imageUrl).filter((url) => url && isManagedUrl(url))
  if (urls.length > 0) {
    try {
      await del(urls)
    } catch (err) {
      console.error('스토리지 파일 삭제 실패:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
