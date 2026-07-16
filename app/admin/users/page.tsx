import { prisma } from '@/lib/prisma'
import UserRow from './UserRow'
import UsersSearchBar from './UsersSearchBar'
import UsersPagination from './UsersPagination'

const SEARCHABLE_FIELDS = ['id', 'name', 'email', 'hphone', 'nick'] as const
type SearchField = (typeof SEARCHABLE_FIELDS)[number] | 'all'

type Props = { searchParams: Promise<{ field?: string; q?: string; page?: string }> }

export default async function AdminUsersPage({ searchParams }: Props) {
  const { field: rawField, q, page: rawPage } = await searchParams
  const field: SearchField = SEARCHABLE_FIELDS.includes(rawField as never)
    ? (rawField as SearchField)
    : 'all'
  const page = Number(rawPage ?? '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where =
    field !== 'all' && q ? { [field]: { contains: q, mode: 'insensitive' as const } } : {}

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { idx: 'desc' },
      skip,
      take: limit,
      select: { idx: true, id: true, name: true, email: true, hphone: true, wdate: true, isAdmin: true },
    }),
    prisma.member.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)
  const qs = `&field=${field}${field !== 'all' && q ? `&q=${encodeURIComponent(q)}` : ''}`

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">회원 관리</h1>

      <div className="flex items-center justify-between">
        <UsersSearchBar field={field} q={q ?? ''} />
        <p className="text-sm text-gray-400">총 {total}명</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-left">아이디</th>
              <th className="py-3 px-4 text-left">이름</th>
              <th className="py-3 px-4 text-left">이메일</th>
              <th className="py-3 px-4 text-left">연락처</th>
              <th className="py-3 px-4 text-center w-28">가입일</th>
              <th className="py-3 px-4 text-center w-20">등급</th>
              <th className="py-3 px-4 text-center w-20">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <UserRow key={m.idx} member={m} />
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UsersPagination page={page} totalPages={totalPages} qs={qs} />
    </div>
  )
}
