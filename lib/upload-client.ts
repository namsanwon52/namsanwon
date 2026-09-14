// 관리자 화면(브라우저)에서 쓰는 업로드 도우미.
// 모든 파일은 서버에서 서명만 받아 Cloudinary로 직접 올린다 (app/api/upload/sign).
export type UploadedFile = { url: string; filename: string }

const MAX_WIDTH = 1600
const WEBP_QUALITY = 0.78

const isImage = (file: File) => file.type.startsWith('image/')

/**
 * 저장 용량을 줄이려고 브라우저에서 가로 1600px 이하 WebP로 재인코딩한다.
 * GIF(애니메이션)나 브라우저가 못 읽는 형식(HEIC 등)은 원본을 그대로 올린다.
 */
async function toWebp(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_WIDTH / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    let blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', WEBP_QUALITY))
    // WebP 인코딩을 지원하지 않는 브라우저는 PNG를 돌려주므로 JPEG로 대신한다
    if (!blob || blob.type !== 'image/webp') {
      blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    }
    if (!blob || blob.size >= file.size) return file
    const ext = blob.type === 'image/webp' ? '.webp' : '.jpg'
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type: blob.type })
  } catch {
    return file
  }
}

async function directUpload(file: File, kind: 'image' | 'raw'): Promise<string> {
  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, kind }),
  })
  const sign = await signRes.json().catch(() => null)
  if (!signRes.ok) throw new Error(sign?.error ?? `업로드 준비에 실패했습니다. (${signRes.status})`)

  const fd = new FormData()
  for (const [k, v] of Object.entries(sign.fields as Record<string, string>)) fd.append(k, v)
  fd.append('file', file)
  const res = await fetch(sign.uploadUrl, { method: 'POST', body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`업로드 실패: ${data?.error?.message ?? res.status}`)
  return data.secure_url as string
}

/** 이미지: WebP로 줄여서 업로드 */
export async function uploadImage(file: File): Promise<UploadedFile> {
  const optimized = await toWebp(file)
  return { url: await directUpload(optimized, 'image'), filename: optimized.name }
}

/** 게시글 첨부: 이미지는 WebP로, 문서는 원본 그대로 (표시 이름은 원래 파일명) */
export async function uploadAttachment(file: File): Promise<UploadedFile> {
  const url = isImage(file) ? (await uploadImage(file)).url : await directUpload(file, 'raw')
  return { url, filename: file.name }
}
