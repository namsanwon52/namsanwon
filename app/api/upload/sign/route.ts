import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { v2 as cloudinary } from 'cloudinary'
import { authOptions } from '@/lib/auth'
import { sanitizeKey } from '@/lib/storage'

// 관리자 첨부파일(문서) 직접 업로드용 서명.
// Vercel 함수는 요청 본문이 4.5MB로 제한돼 PDF·HWP 공고문이 막히므로,
// 브라우저가 Cloudinary로 바로 올리고 서버는 서명만 발급한다.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { filename } = (await req.json()) as { filename?: string }
  if (!filename) return NextResponse.json({ error: '파일명 없음' }, { status: 400 })

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary 설정 없음' }, { status: 500 })
  }

  // raw 리소스는 public_id가 곧 다운로드 파일명이 되므로 원래 이름을 살린다.
  const publicId = sanitizeKey(`attachments/${Date.now()}/${filename}`)
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request({ public_id: publicId, timestamp }, apiSecret)

  return NextResponse.json({
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    fields: { api_key: apiKey, timestamp: String(timestamp), public_id: publicId, signature },
  })
}
