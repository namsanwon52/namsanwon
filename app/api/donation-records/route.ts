import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const records = await prisma.donationRecord.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const record = await prisma.donationRecord.upsert({
    where: { year_month: { year: body.year, month: body.month } },
    update: { content: body.content },
    create: body,
  })
  return NextResponse.json(record, { status: 201 })
}
