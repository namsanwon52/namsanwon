import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

// 관리자 에디터 이미지 업로드 → Vercel Blob (서버리스 환경에서 로컬 파일시스템 대신)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

  const bytes = Buffer.from(new Uint8Array(await file.arrayBuffer()))
  const safeName = file.name.replace(/\s+/g, '_')
  const blobPath = `editor/${Date.now()}-${safeName}`

  const blob = await put(blobPath, bytes, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
    addRandomSuffix: false,
    allowOverwrite: true,
  })

  return NextResponse.json({ url: blob.url, filename: file.name })
}
