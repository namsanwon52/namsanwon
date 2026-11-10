/**
 * 첨부파일 URL 도우미 (서버·클라이언트 공용, SDK 불필요).
 *
 * PDF는 Cloudinary 계정 보안 설정상 원본 URL로는 배달되지 않는다(401, "deny or ACL failure").
 * - 다운로드: /api/files/<id> 가 권한 확인 후 API 서명 다운로드 URL로 넘긴다.
 * - 썸네일: PDF를 image 리소스로 올리면 첫 페이지를 JPG로 변환해 배달할 수 있다(이건 허용됨).
 *   raw 로 올라간 예전 PDF는 변환이 불가능해 썸네일이 없다.
 */
import { bucketWidth, cldImage } from './cloudinary-url'

type FileLike = { id?: number; url: string; filename: string }

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|bmp|webp|avif)$/i
const PDF_IMAGE_RE = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+\.pdf$/i

export const isImageFile = (f: FileLike) => IMAGE_EXT_RE.test(f.filename)
export const isPdfFile = (f: FileLike) => /\.pdf$/i.test(f.filename) || /\.pdf$/i.test(f.url)

/** image 리소스로 올라간 PDF의 1페이지 썸네일 URL (raw PDF면 null) */
export function pdfThumbUrl(url: string, width: number): string | null {
  if (!PDF_IMAGE_RE.test(url)) return null
  const seg = '/image/upload/'
  const i = url.indexOf(seg) + seg.length
  const rest = url.slice(i).replace(/\.pdf$/i, '.jpg')
  return `${url.slice(0, i)}pg_1,q_auto:eco,c_limit,w_${bucketWidth(width)}/${rest}`
}

/** 목록 썸네일: 첫 이미지 첨부 → 없으면 PDF 1페이지 */
export function fileThumbUrl(files: FileLike[], width: number): string | null {
  const img = files.find(isImageFile)
  if (img) return cldImage(img.url, width)
  for (const f of files) {
    const t = isPdfFile(f) ? pdfThumbUrl(f.url, width) : null
    if (t) return t
  }
  return null
}

/** 다운로드 링크: PDF는 서버 경유(배달 차단 회피), 그 외는 원본 URL */
export function fileHref(f: FileLike): string {
  return isPdfFile(f) && f.id ? `/api/files/${f.id}` : f.url
}
