/**
 * Cloudinary 배달 URL에 자동 최적화 파라미터를 붙인다 (서버·클라이언트 공용, SDK 불필요).
 *
 * - f_auto: 브라우저가 지원하면 AVIF/WebP로 배달
 * - q_auto: 화질을 눈에 띄지 않는 선에서 자동 압축 (640px 이하 썸네일은 q_auto:eco)
 * - c_limit,w_N: 표시 크기에 맞춰 줄이되 원본보다 키우지 않음
 *
 * Cloudinary는 변환 결과(derived)를 한 번 만들어 저장·CDN 캐시하므로, URL이 같으면 다시
 * 연산하지 않는다. 대신 URL 조합이 늘어날수록 변환 크레딧이 늘어나므로 너비는 반드시
 * WIDTHS 버킷 중 하나로 맞춘다 (임의 너비 금지).
 *
 * Cloudinary 이미지가 아니거나(옛 Vercel Blob, 로컬 파일) 이미 변환 파라미터가 붙은 URL은 그대로 둔다.
 * ⚠️ DB에는 변환 없는 원본 URL만 저장해야 한다 (lib/storage.ts의 keyFromUrl이 원본 형태를 기대).
 */

export const WIDTHS = [320, 640, 960, 1280, 1600] as const

const UPLOAD_SEGMENT = '/image/upload/'
const CLOUDINARY_IMAGE_RE = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//

/** 요청 너비 이상인 가장 작은 버킷 (최대 1600) */
export function bucketWidth(width: number): number {
  return WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1]
}

export function cldImage(url: string | null | undefined, width: number): string {
  if (!url || !CLOUDINARY_IMAGE_RE.test(url)) return url ?? ''
  const idx = url.indexOf(UPLOAD_SEGMENT) + UPLOAD_SEGMENT.length
  const rest = url.slice(idx)
  // 버전(v123/) 또는 폴더로 바로 시작하지 않으면 이미 변환이 붙어 있다고 본다
  const firstSeg = rest.split('/')[0]
  if (/^[a-z]{1,3}_/.test(firstSeg) && !/^v\d+$/.test(firstSeg)) return url
  const w = bucketWidth(width)
  // 작은 썸네일은 이미 압축된 WebP라 q_auto(good)로는 오히려 커져서 eco 품질을 쓴다 (실측 -8%)
  const quality = w <= 640 ? 'q_auto:eco' : 'q_auto'
  return `${url.slice(0, idx)}f_auto,${quality},c_limit,w_${w}/${rest}`
}

/** 화면 폭 기준 반응형 srcSet (Cloudinary 이미지가 아니면 undefined → 브라우저가 src 사용) */
export function responsiveSrcSet(url: string | null | undefined, widths: readonly number[] = [640, 960, 1280, 1600]) {
  if (!url || !CLOUDINARY_IMAGE_RE.test(url)) return undefined
  return widths.map((w) => `${cldImage(url, w)} ${w}w`).join(', ')
}

/** 게시글 본문 HTML 안의 Cloudinary <img> src를 최적화 URL로 바꾼다 (공개 화면 렌더 전용) */
export function optimizeHtmlImages(html: string, width = 1280): string {
  if (!html) return html
  return html.replace(
    /(<img\b[^>]*?\ssrc=)(["']?)(https:\/\/res\.cloudinary\.com\/[^"'\s>]+)\2/gi,
    (_m, prefix, quote, src) => `${prefix}${quote || '"'}${cldImage(src, width)}${quote || '"'}`,
  )
}
