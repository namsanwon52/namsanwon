'use client'
import { useRouter } from 'next/navigation'

type MemberRow = {
  idx: number
  id: string
  name: string | null
  email: string | null
  hphone: string | null
  wdate: Date | null
  isAdmin: boolean
}

export default function UserRow({ member }: { member: MemberRow }) {
  const router = useRouter()

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/members/${member.idx}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <tr
      onClick={() => router.push(`/admin/users/${member.idx}`)}
      className="border-b hover:bg-gray-50 cursor-pointer"
    >
      <td className="py-3 px-4">{member.id}</td>
      <td className="py-3 px-4">{member.name || '-'}</td>
      <td className="py-3 px-4 text-gray-500">{member.email || '-'}</td>
      <td className="py-3 px-4 text-gray-500">{member.hphone || '-'}</td>
      <td className="py-3 px-4 text-center text-gray-400">
        {member.wdate ? new Date(member.wdate).toLocaleDateString('ko-KR') : '-'}
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`px-2.5 py-1 rounded-full text-xs ${
            member.isAdmin ? 'bg-[#fdecd8] text-[#854F0B]' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {member.isAdmin ? '관리자' : '일반'}
        </span>
      </td>
      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/admin/users/${member.idx}`)}
            className="text-xs text-[#3B9EDA] hover:underline"
          >
            수정
          </button>
          <span className="text-gray-200">|</span>
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">
            삭제
          </button>
        </div>
      </td>
    </tr>
  )
}
