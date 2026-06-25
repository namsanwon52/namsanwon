'use client'
import { useRouter } from 'next/navigation'

export default function SliderControls({ id, active }: { id: number; active: boolean }) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/slider/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1.5 rounded-full text-xs ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? '활성' : '비활성'}
    </button>
  )
}
