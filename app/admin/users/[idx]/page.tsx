'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Form = {
  id: string
  name: string
  nick: string
  email: string
  hphone: string
  address1: string
  isAdmin: boolean
}

export default function AdminUserEditPage() {
  const router = useRouter()
  const { idx } = useParams<{ idx: string }>()

  const [form, setForm] = useState<Form>({
    id: '',
    name: '',
    nick: '',
    email: '',
    hphone: '',
    address1: '',
    isAdmin: false,
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/members/${idx}`)
      .then((r) => r.json())
      .then((m) => {
        setForm({
          id: m.id,
          name: m.name ?? '',
          nick: m.nick ?? '',
          email: m.email ?? '',
          hphone: m.hphone ?? '',
          address1: m.address1 ?? '',
          isAdmin: m.isAdmin,
        })
      })
      .finally(() => setFetching(false))
  }, [idx])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm('회원 정보가 수정됩니다. 진행하시겠습니까?')) return

    setLoading(true)
    const res = await fetch(`/api/members/${idx}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        nick: form.nick,
        email: form.email,
        hphone: form.hphone,
        address1: form.address1,
        isAdmin: form.isAdmin,
      }),
    })
    if (res.ok) {
      router.push('/admin/users')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('회원 정보가 삭제됩니다. 진행하시겠습니까?')) return

    setLoading(true)
    const res = await fetch(`/api/members/${idx}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/users')
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">회원 수정</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-xs text-gray-400 mb-1">아이디</label>
          <input
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500"
            value={form.id}
            disabled
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">이름</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">닉네임</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            value={form.nick}
            onChange={(e) => setForm({ ...form, nick: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">이메일</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">전화</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            value={form.hphone}
            onChange={(e) => setForm({ ...form, hphone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">주소</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            value={form.address1}
            onChange={(e) => setForm({ ...form, address1: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">등급</label>
          <button
            type="button"
            onClick={() => setForm({ ...form, isAdmin: !form.isAdmin })}
            className={`px-3 py-1.5 rounded-full text-xs ${
              form.isAdmin ? 'bg-[#fdecd8] text-[#854F0B]' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {form.isAdmin ? '관리자' : '일반'}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e] disabled:opacity-50"
            >
              {loading ? '처리 중...' : '수정'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
