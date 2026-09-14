'use client'
import { useRef, useState } from 'react'
import { uploadAttachment, type UploadedFile } from '@/lib/upload-client'

interface Props {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

// 게시글 첨부파일 목록: 추가(여러 개) / 삭제. 저장은 상위 폼이 files 배열로 함께 보낸다.
export default function AttachmentField({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSelect(list: FileList | null) {
    if (!list?.length) return
    setUploading(true)
    const added: UploadedFile[] = []
    try {
      for (const file of Array.from(list)) {
        try {
          added.push(await uploadAttachment(file))
        } catch (e) {
          alert(`${file.name}: ${(e as Error).message}`)
        }
      }
    } finally {
      onChange([...files, ...added])
      setUploading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1b1c1c]">첨부파일</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? '업로드 중...' : '파일 추가'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleSelect(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-gray-400">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.url}-${i}`} className="flex items-center justify-between gap-3 text-sm">
              <a href={f.url} target="_blank" rel="noreferrer" className="truncate text-[#456805] hover:underline">
                📎 {f.filename}
              </a>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="shrink-0 text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
