'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminBoardGroup } from '@/lib/board'

export default function PostsCategoryFilter({
  groups,
  activeCategory,
  activeGroupKey,
}: {
  groups: AdminBoardGroup[]
  activeCategory: string
  activeGroupKey: string
}) {
  const router = useRouter()
  const [groupKey, setGroupKey] = useState(activeGroupKey)

  const currentGroup = groups.find((g) => g.key === groupKey) ?? groups[0]

  function handleGroupChange(nextKey: string) {
    setGroupKey(nextKey)
    const nextGroup = groups.find((g) => g.key === nextKey)
    const firstCode = nextGroup?.items[0]?.code
    if (firstCode) router.push(`/admin/posts?category=${firstCode}`)
  }

  return (
    <div className="space-y-2">
      <select
        value={groupKey}
        onChange={(e) => handleGroupChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#E8863A]"
      >
        {groups.map((g) => (
          <option key={g.key} value={g.key}>
            {g.title}
          </option>
        ))}
      </select>
      <div className="flex gap-2 flex-wrap">
        {currentGroup.items.map((item) => (
          <a
            key={item.code}
            href={`/admin/posts?category=${item.code}`}
            className={`px-3 py-1.5 rounded-full text-sm ${
              item.code === activeCategory
                ? 'bg-[#E8863A] text-white'
                : 'bg-white border text-gray-600 hover:border-[#E8863A]'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}
