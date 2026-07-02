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
      <div className="postActions">
        <Link href={editHref} className="editLink">
          수정
        </Link>
        <span className="sep">|</span>
        <button onClick={onDeleteClick} className="deleteBtn">
          삭제
        </button>
      </div>

      {/* 비밀번호 삭제 모달 */}
      {showDeleteModal && (
        <div className="modalOverlay">
          <div className="modalCard">
            <h3>게시글 삭제</h3>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              className="formField"
              autoFocus
            />
            {error && <p className="formError">{error}</p>}
            <div className="formActions">
              <button
                onClick={() => { setShowDeleteModal(false); setPassword(''); setError('') }}
                className="btnGhost"
              >
                취소
              </button>
              <button onClick={handleDelete} disabled={loading || !password} className="btnDanger">
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
