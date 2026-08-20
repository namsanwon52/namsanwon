'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoomForm from './RoomForm'
import RoomCard from './RoomCard'

type Room = {
  id: number
  floorId: number
  name: string
  imageUrl: string
  imageAlt: string
  order: number
  active: boolean
}
type Floor = { id: number; name: string; order: number; active: boolean; rooms: Room[] }

export default function FloorCard({ floor }: { floor: Floor }) {
  const router = useRouter()
  const [name, setName] = useState(floor.name)
  const [order, setOrder] = useState(String(floor.order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/facility/floors/${floor.id}`, {
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

  async function remove() {
    if (!confirm(`"${floor.name}" 층과 그 안의 공간 ${floor.rooms.length}개를 모두 삭제하시겠습니까?`)) return
    await fetch(`/api/facility/floors/${floor.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex gap-2 items-end flex-wrap border-b pb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">층 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#88b04b]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">순서</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#88b04b]"
          />
        </div>
        <button
          onClick={() => patch({ name, order: Number(order) })}
          disabled={saving}
          className="px-3 py-2 rounded-lg text-xs bg-[#88b04b] text-white hover:bg-[#456805] disabled:opacity-50"
        >
          저장
        </button>
        <button
          onClick={() => patch({ active: !floor.active })}
          className={`px-3 py-2 rounded-lg text-xs ${
            floor.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {floor.active ? '노출' : '숨김'}
        </button>
        <button onClick={remove} className="px-3 py-2 rounded-lg text-xs bg-red-100 text-red-600">
          층 삭제
        </button>
        {error && <p className="w-full text-sm text-red-500">{error}</p>}
      </div>

      {floor.rooms.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">등록된 공간이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {floor.rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      <RoomForm floorId={floor.id} />
    </section>
  )
}
