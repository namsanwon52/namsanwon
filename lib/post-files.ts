import { isManagedUrl } from './storage'

/** 요청 본문의 첨부 목록을 검증해 File 레코드 입력으로 바꾼다 (우리 스토리지 URL만 허용) */
export function toFileRows(files: unknown): { url: string; filename: string }[] {
  if (!Array.isArray(files)) return []
  return files
    .filter(
      (f): f is { url: string; filename: string } =>
        typeof f?.url === 'string' && typeof f?.filename === 'string' && isManagedUrl(f.url),
    )
    .map((f) => ({ url: f.url, filename: f.filename.slice(0, 255) }))
}
