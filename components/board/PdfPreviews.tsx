import { fileHref, isPdfFile, pdfThumbUrl } from '@/lib/file-url'

type FileRow = { id: number; url: string; filename: string }

// 본문 이미지가 없는 글(소식지 등)에서 PDF 첨부의 1페이지를 미리보기로 보여준다. 누르면 PDF를 연다.
export default function PdfPreviews({ files }: { files: FileRow[] }) {
  const previews = files
    .filter(isPdfFile)
    .map((f) => ({ f, thumb: pdfThumbUrl(f.url, 960) }))
    .filter((x): x is { f: FileRow; thumb: string } => !!x.thumb)
  if (previews.length === 0) return null
  return (
    <div className="postImages">
      {previews.map(({ f, thumb }) => (
        <a key={f.id} href={fileHref(f)} target="_blank" rel="noopener" title={`${f.filename} 열기`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={`${f.filename} 첫 페이지`} loading="lazy" />
        </a>
      ))}
    </div>
  )
}
