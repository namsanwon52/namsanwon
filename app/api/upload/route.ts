import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@/lib/storage'
import { optimizeImage } from '@/lib/image-optimize'

// 관리자 에디터 이미지 업로드 → Cloudinary (서버리스 환경에서 로컬 파일시스템 대신)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

    const bytes = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    const safeName = file.name.replace(/\s+/g, '_')

    // 이미지는 WebP로 재인코딩해 저장 용량을 절약한다 (문서 등은 원본 통과)
    const optimized = await optimizeImage(bytes, safeName, {
      fallbackContentType: file.type || 'application/octet-stream',
    })

    const key = `editor/${Date.now()}-${optimized.filename}`
    const uploaded = await put(key, optimized.data, { contentType: optimized.contentType })

    return NextResponse.json({ url: uploaded.url, filename: optimized.filename })
  } catch (e) {
    // Cloudinary 오류는 { message, http_code } 형태라 Error 인스턴스가 아닐 수 있다
    const err = e as { message?: string; http_code?: number; error?: { message?: string } }
    const message = err?.message ?? err?.error?.message ?? String(e)
    console.error('[upload] 실패:', e)
    return NextResponse.json({ error: `업로드 실패: ${message}` }, { status: 500 })
  }
}
