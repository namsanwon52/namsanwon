import { NextResponse } from 'next/server'
import { MEMBER_COOKIE_NAME } from '@/lib/memberSession'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBER_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
