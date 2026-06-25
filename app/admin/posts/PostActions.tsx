'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PostActions({ id }: { id: number }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={`/admin/posts/${id}/edit`}
        className="text-xs text-[#3B9EDA] hover:underline"
      >
        수정
      </Link>
      <span className="text-gray-200">|</span>
      <button
        onClick={handleDelete}
        className="text-xs text-red-400 hover:text-red-600"
      >
        삭제
      </button>
    </div>
  )
}
