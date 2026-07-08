import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const images = await prisma.sliderImage.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(images)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()

  const duplicate = await prisma.sliderImage.findFirst({ where: { order: body.order } })
  if (duplicate) {
    return NextResponse.json({ error: `이미 사용 중인 순서입니다. (순서: ${body.order})` }, { status: 409 })
  }

  const image = await prisma.sliderImage.create({ data: body })
  return NextResponse.json(image, { status: 201 })
}
