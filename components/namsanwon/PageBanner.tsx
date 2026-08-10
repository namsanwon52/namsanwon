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
      </div>
    </section>
  )
}
