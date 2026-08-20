import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseHistoryInput } from '@/lib/history'

export async function GET() {
  const entries = await prisma.historyEntry.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { order: 'asc' }, { id: 'desc' }],
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const parsed = parseHistoryInput(await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const entry = await prisma.historyEntry.create({ data: parsed.data })
  return NextResponse.json(entry, { status: 201 })
}
