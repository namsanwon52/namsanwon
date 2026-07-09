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
  const activeItem =
    currentGroup.items.find(
      (i) => i.code === activeCategory || i.subTabs?.some((t) => t.code === activeCategory)
    ) ?? currentGroup.items[0]

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
              item.code === activeItem?.code
                ? 'bg-[#E8863A] text-white'
                : 'bg-white border text-gray-600 hover:border-[#E8863A]'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
      {activeItem?.subTabs && (
        <div className="flex gap-2 flex-wrap pl-2 border-l-2 border-gray-100">
          {activeItem.subTabs.map((tab) => (
            <a
              key={tab.code}
              href={`/admin/posts?category=${tab.code}`}
              className={`px-3 py-1 rounded-full text-xs ${
                tab.code === activeCategory
                  ? 'bg-[#3D2B1F] text-white'
                  : 'bg-gray-50 border text-gray-500 hover:border-[#3D2B1F]'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
