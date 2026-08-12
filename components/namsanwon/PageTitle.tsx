export default function PageTitle({
  title,
  crumbs = [],
}: {
  title: string
  desc?: string
  crumbs?: string[]
}) {
  return (
     <div className="boardTitleRow">
          <h2 className="boardTitle">{title}</h2>
          <nav className="boardBreadcrumb" aria-label="현재 위치">
            <span aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
            {crumbs.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </nav>
        </div>
  )
}
