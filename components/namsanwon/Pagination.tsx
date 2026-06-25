import Link from 'next/link'

export default function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number
  totalPages: number
  basePath: string
  query?: string
}) {
  if (totalPages <= 1) return null

  const GROUP = 10
  const start = Math.floor((page - 1) / GROUP) * GROUP + 1
  const end = Math.min(start + GROUP - 1, totalPages)
  const qs = query ? `&q=${encodeURIComponent(query)}` : ''
  const href = (p: number) => `${basePath}?page=${p}${qs}`

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {start > 1 && <Link href={href(start - 1)} aria-label="이전 묶음">‹</Link>}
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) =>
        p === page ? (
          <span key={p} className="isActive" aria-current="page">{p}</span>
        ) : (
          <Link key={p} href={href(p)}>{p}</Link>
        )
      )}
      {end < totalPages && <Link href={href(end + 1)} aria-label="다음 묶음">›</Link>}
    </nav>
  )
}
