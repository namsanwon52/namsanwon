'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  id: number
  category: string
  isAdmin: boolean   // 관리자 세션 여부
  hasPassword: boolean  // 비밀번호 게시글 여부
}

export default function PostActionsPublic({ id, category, isAdmin, hasPassword }: Props) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isAdmin && !hasPassword) return null

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: hasPassword && !isAdmin ? JSON.stringify({ password }) : undefined,
      })
      if (res.ok) {
        router.push(`/board/${category}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? '삭제 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  function onDeleteClick() {
    if (isAdmin) {
      if (confirm('삭제하시겠습니까?')) handleDelete()
    } else {
      setShowDeleteModal(true)
    }
  }

  const editHref = isAdmin
    ? `/admin/posts/${id}/edit`
    : `/board/${category}/${id}/edit`

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href={editHref}
          className="text-sm text-[#3B9EDA] hover:underline"
        >
          수정
        </Link>
        <span className="text-gray-200">|</span>
        <button
          onClick={onDeleteClick}
          className="text-sm text-red-400 hover:text-red-600"
        >
          삭제
        </button>
      </div>

      {/* 비밀번호 삭제 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 space-y-4">
            <h3 className="font-bold text-[#3D2B1F]">게시글 삭제</h3>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setPassword(''); setError('') }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !password}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
