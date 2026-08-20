'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Room = {
  id: number
  name: string
  imageUrl: string
  imageAlt: string
  order: number
  active: boolean
}

export default function RoomCard({ room }: { room: Room }) {
  const router = useRouter()
  const [name, setName] = useState(room.name)
  const [order, setOrder] = useState(String(room.order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/facility/rooms/${room.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '저장에 실패했습니다.')
      return
    }
    router.refresh()
  }

  // 사진 교체: 새 파일을 올리고 URL만 바꾼다(이전 파일은 서버에서 정리).
  async function replacePhoto(file: File) {
    setSaving(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) {
      setSaving(false)
      setError('사진 업로드에 실패했습니다.')
      return
    }
    const uploaded = await uploadRes.json()
    await patch({ imageUrl: uploaded.url })
  }

  async function remove() {
    if (!confirm(`"${room.name}" 공간을 삭제하시겠습니까? 사진도 함께 삭제됩니다.`)) return
    await fetch(`/api/facility/rooms/${room.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${room.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}>
      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-gray-100">
        {room.imageUrl && (
          <Image src={room.imageUrl} alt={room.imageAlt || room.name} fill className="object-cover" unoptimized />
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#88b04b]"
        />
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          title="순서"
          className="w-14 border border-gray-200 rounded-lg px-1 py-1 text-sm text-center focus:outline-none focus:border-[#88b04b]"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => patch({ name, order: Number(order) })}
          disabled={saving}
          className="px-2.5 py-1.5 rounded-full text-xs bg-[#88b04b] text-white hover:bg-[#456805] disabled:opacity-50"
        >
          저장
        </button>
        <label className="px-2.5 py-1.5 rounded-full text-xs bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200">
          사진 교체
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) replacePhoto(file)
            }}
          />
        </label>
        <button
          onClick={() => patch({ active: !room.active })}
          className={`px-2.5 py-1.5 rounded-full text-xs ${
            room.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {room.active ? '노출' : '숨김'}
        </button>
        <button onClick={remove} className="px-2.5 py-1.5 rounded-full text-xs bg-red-100 text-red-600">
          삭제
        </button>
      </div>
    </div>
  )
}
