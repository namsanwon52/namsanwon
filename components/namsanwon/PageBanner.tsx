export default function PageBanner({
  title,
  desc,
  crumbs = [],
}: {
  title: string
  desc?: string
  crumbs?: string[]
}) {
  return (
    <section className="pageBanner">
      <div className="pageBannerInner">
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
        <nav className="breadcrumb" aria-label="현재 위치">
          <span>홈</span>
          {crumbs.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </nav>
      </div>
    </section>
  )
}
