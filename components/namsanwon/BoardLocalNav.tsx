import Link from 'next/link'
import type { BoardSection } from '@/lib/board'

export default function BoardLocalNav({
  section,
  activeCode,
}: {
  section: BoardSection
  activeCode: string
}) {
  return (
    <nav className="boardLocalNav" aria-label={`${section.title} 메뉴`}>
      <div className="boardLocalNavInner">
        {section.localNav.map((item) => (
          <Link
            key={item.code}
            href={`/board/${item.code}`}
            className={item.code === activeCode ? 'isActive' : ''}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
