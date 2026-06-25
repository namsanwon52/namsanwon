import Link from 'next/link'

export type GalleryItem = {
  id: number
  title: string
  thumbUrl: string | null
}

export default function GalleryPanel({ items }: { items: GalleryItem[] }) {
  return (
    <div className="galleryPanel" aria-labelledby="galleryTitle">
      <div className="panelTitle">
        <h3 id="galleryTitle">포토갤러리</h3>
        <Link className="moreButton" href="/board/com3" aria-label="포토갤러리 더보기" />
      </div>

      <div className="galleryGrid">
        {items.map((item) => (
          <Link href={`/board/com3/${item.id}`} className="galleryCard" key={item.id}>
            <span className="thumb" aria-hidden="true">
              {item.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbUrl} alt="" loading="lazy" />
              )}
            </span>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </div>
    </div>
  )
}
