import Link from 'next/link'

const GROUP = 10

export default function UsersPagination({
  page,
  totalPages,
  qs,
}: {
  page: number
  totalPages: number
  qs: string
}) {
  if (totalPages <= 1) return null

  const start = Math.floor((page - 1) / GROUP) * GROUP + 1
  const end = Math.min(start + GROUP - 1, totalPages)
  const href = (p: number) => `/admin/users?page=${p}${qs}`

  const arrowClass = (disabled: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-gray-500 ${disabled ? 'opacity-30 pointer-events-none' : 'hover:bg-gray-100'}`

  return (
    <nav className="flex items-center justify-center gap-1 text-sm">
      <Link href={href(1)} aria-label="처음으로" className={arrowClass(page === 1)}>
        «
      </Link>
      <Link href={href(start - 1)} aria-label="이전 10개" className={arrowClass(start === 1)}>
        ‹
      </Link>
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) =>
        p === page ? (
          <span key={p} className="px-3 py-1.5 rounded-lg bg-[#E8863A] text-white" aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className="px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            {p}
          </Link>
        )
      )}
      <Link href={href(end + 1)} aria-label="다음 10개" className={arrowClass(end === totalPages)}>
        ›
      </Link>
      <Link href={href(totalPages)} aria-label="마지막으로" className={arrowClass(page === totalPages)}>
        »
      </Link>
    </nav>
  )
}
