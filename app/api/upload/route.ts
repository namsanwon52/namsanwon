import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@/lib/storage'

// 서버 경유 업로드(작은 파일용 예비 경로). 관리자 화면은 lib/upload-client.ts로
// 브라우저에서 WebP 변환 후 Cloudinary에 직접 올린다.
// sharp는 Vercel에서 로드에 실패해 이 라우트 전체를 500으로 만들었으므로 여기서 쓰지 않는다.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

    const data = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    const safeName = file.name.replace(/\s+/g, '_')
    const uploaded = await put(`editor/${Date.now()}-${safeName}`, data, {
      contentType: file.type || 'application/octet-stream',
    })

    return NextResponse.json({ url: uploaded.url, filename: safeName })
  } catch (e) {
    // Cloudinary 오류는 { message, http_code } 형태라 Error 인스턴스가 아닐 수 있다
    const err = e as { message?: string; error?: { message?: string } }
    console.error('[upload] 실패:', e)
    return NextResponse.json({ error: `업로드 실패: ${err?.message ?? err?.error?.message ?? String(e)}` }, { status: 500 })
  }
}
