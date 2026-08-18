import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@/lib/storage'
import { optimizeImage } from '@/lib/image-optimize'

// 관리자 에디터 이미지 업로드 → Vercel Blob (서버리스 환경에서 로컬 파일시스템 대신)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

  const bytes = Buffer.from(new Uint8Array(await file.arrayBuffer()))
  const safeName = file.name.replace(/\s+/g, '_')

  // 이미지는 WebP로 재인코딩해 Blob 용량을 절약한다 (문서 등은 원본 통과)
  const optimized = await optimizeImage(bytes, safeName, {
    fallbackContentType: file.type || 'application/octet-stream',
  })

  const key = `editor/${Date.now()}-${optimized.filename}`
  const uploaded = await put(key, optimized.data, { contentType: optimized.contentType })

  return NextResponse.json({ url: uploaded.url, filename: optimized.filename })
}
