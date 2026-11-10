import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { canViewBoard } from '@/lib/boardAccess'

// 첨부파일 다운로드. PDF는 Cloudinary 원본 URL 배달이 막혀 있어(401) API 서명 다운로드 URL로 넘긴다.
// 서명 URL은 1시간 뒤 만료되므로 링크는 항상 이 경로를 가리키게 한다.
const CLD_RE = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const file = await prisma.file.findUnique({
    where: { id },
    select: { url: true, post: { select: { code: true, isSecret: true } } },
  })
  if (!file) return NextResponse.json({ error: '없는 파일' }, { status: 404 })

  // 게시글 열람 권한과 같게: 로그인 필요 게시판은 로그인, 비밀글 첨부는 관리자만
  if (!(await canViewBoard(file.post.code))) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  if (file.post.isSecret && !(await getServerSession(authOptions))) {
    return NextResponse.json({ error: '비밀글 첨부입니다.' }, { status: 403 })
  }

  const m = file.url.match(CLD_RE)
  if (!m) return NextResponse.redirect(file.url)

  const resourceType = m[1] as 'image' | 'raw'
  const key = decodeURIComponent(m[2])
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  // image 리소스는 public_id에서 확장자를 떼고 format으로 넘긴다. raw는 확장자까지가 public_id.
  const url =
    resourceType === 'image'
      ? cloudinary.utils.private_download_url(key.replace(/\.[^./]+$/, ''), key.split('.').pop() ?? '', {
          resource_type: 'image',
          type: 'upload',
        })
      : cloudinary.utils.private_download_url(key, '', { resource_type: 'raw', type: 'upload' })
  return NextResponse.redirect(url)
}
