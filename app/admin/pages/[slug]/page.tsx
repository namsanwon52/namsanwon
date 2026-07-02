'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAboutPage } from '@/lib/pages'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), { ssr: false })

export default function AdminPageEdit() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const meta = getAboutPage(slug)

  const [content, setContent] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        setContent(p?.content ?? '')
        setLoaded(true)
      })
  }, [slug])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/pages/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: meta?.title, content }),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3D2B1F]">{meta?.title ?? slug} 편집</h1>
        <a
          href={`/about/${meta?.route ?? slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#E8863A] hover:underline"
        >
          공개 페이지 보기 ↗
        </a>
      </div>

      {!loaded ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <RichEditor value={content} onChange={setContent} placeholder="페이지 내용을 입력하세요." />
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
            <button
              type="button"
              onClick={() => router.push('/admin/pages')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              목록
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e] disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
