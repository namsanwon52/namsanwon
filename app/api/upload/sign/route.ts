import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { v2 as cloudinary } from 'cloudinary'
import { authOptions } from '@/lib/auth'
import { sanitizeKey } from '@/lib/storage'

// 관리자 업로드용 서명. 브라우저가 Cloudinary로 바로 올리고 서버는 서명만 발급한다.
// - Vercel 함수 요청 본문 한도(4.5MB)에 걸리지 않는다.
// - 서버에서 sharp를 쓰지 않는다 (Vercel에서 sharp 로드가 실패해 업로드 라우트가 죽었음).
//   이미지는 브라우저에서 WebP로 줄여서 올린다 (lib/upload-client.ts).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 })

  const { filename, kind } = (await req.json()) as { filename?: string; kind?: 'image' | 'raw' }
  if (!filename) return NextResponse.json({ error: '파일명 없음' }, { status: 400 })

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary 설정 없음' }, { status: 500 })
  }

  const resourceType = kind === 'image' ? 'image' : 'raw'
  // 이미지는 확장자를 뺀 public_id(형식은 Cloudinary가 관리),
  // raw 리소스는 public_id가 곧 다운로드 파일명이 되므로 원래 이름을 살린다.
  const publicId =
    resourceType === 'image'
      ? sanitizeKey(`editor/${Date.now()}-${filename.replace(/\.[^./]+$/, '')}`)
      : sanitizeKey(`attachments/${Date.now()}/${filename}`)
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request({ public_id: publicId, timestamp }, apiSecret)

  return NextResponse.json({
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    fields: { api_key: apiKey, timestamp: String(timestamp), public_id: publicId, signature },
  })
}
