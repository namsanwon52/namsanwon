type Props = { title: string; breadcrumb: string[] }

export default function PageHeader({ title, breadcrumb }: Props) {
  return (
    <div className="relative bg-gradient-to-r from-[#3B9EDA] to-[#5bb8f5] text-white py-12 overflow-hidden">
      {/* 배경 원형 장식 */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-4 right-32 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 left-20 w-36 h-36 rounded-full bg-white/5" />
      <div className="absolute bottom-2 left-4 w-16 h-16 rounded-full bg-[#FF7A59]/20" />

      <div className="relative max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">{title}</h1>
        <nav aria-label="브레드크럼">
          <ol className="flex items-center gap-1.5 text-sm text-white/75">
            {breadcrumb.map((crumb, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className={idx === breadcrumb.length - 1 ? 'text-white font-medium' : ''}>
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
