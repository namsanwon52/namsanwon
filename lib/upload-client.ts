// 관리자 화면(브라우저)에서 쓰는 업로드 도우미.
export type UploadedFile = { url: string; filename: string }

// Vercel 함수 요청 본문 한도(4.5MB)보다 여유 있게 잡는다.
const SERVER_UPLOAD_LIMIT = 4 * 1024 * 1024
const MAX_WIDTH = 1600

const isImage = (file: File) => /^image\/(jpeg|png|webp|bmp)$/.test(file.type)

/** 휴대폰 사진처럼 큰 이미지는 브라우저에서 줄여 서버 한도를 넘지 않게 한다 (GIF 제외) */
async function shrinkImage(file: File): Promise<File> {
  if (!isImage(file) || file.size <= SERVER_UPLOAD_LIMIT) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/** 이미지: 서버(/api/upload)에서 WebP로 재인코딩해 저장 */
export async function uploadImage(file: File): Promise<UploadedFile> {
  const fd = new FormData()
  fd.append('file', await shrinkImage(file))
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    if (res.status === 413) throw new Error('파일이 너무 큽니다.')
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `이미지 업로드에 실패했습니다. (${res.status})`)
  }
  return res.json()
}

/** 문서 등 이미지가 아닌 첨부: 서명을 받아 Cloudinary에 직접 업로드 */
async function uploadDocument(file: File): Promise<UploadedFile> {
  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name }),
  })
  if (!signRes.ok) throw new Error('업로드 준비에 실패했습니다.')
  const { uploadUrl, fields } = (await signRes.json()) as { uploadUrl: string; fields: Record<string, string> }

  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  fd.append('file', file)
  const res = await fetch(uploadUrl, { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message ?? '첨부파일 업로드에 실패했습니다.')
  return { url: data.secure_url, filename: file.name }
}

export async function uploadAttachment(file: File): Promise<UploadedFile> {
  if (isImage(file) || file.type === 'image/gif') {
    const uploaded = await uploadImage(file)
    return { url: uploaded.url, filename: file.name }
  }
  return uploadDocument(file)
}
