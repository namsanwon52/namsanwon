import { prisma } from '@/lib/prisma'
import { cachedQuery, CACHE_TAGS } from '@/lib/cache'
import HeroSlider from '@/components/namsanwon/HeroSlider'
import QuickAction from '@/components/namsanwon/QuickAction'
import BoardPanel from '@/components/namsanwon/BoardPanel'
import GalleryPanel from '@/components/namsanwon/GalleryPanel'

const listSelect = { id: true, title: true, createdAt: true } as const

const getHomeData = cachedQuery('home', [CACHE_TAGS.posts, CACHE_TAGS.slider], () =>
  Promise.all([
    prisma.post.findMany({ where: { code: 'nt1' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({ where: { code: 'nt2' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({ where: { code: 'com1' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({
      where: { code: 'com3' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, files: { take: 1, select: { url: true } } },
    }),
    prisma.sliderImage.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
  ])
)

export default async function HomePage() {
  const [notice, budget, qna, gallery, sliderImages] = await getHomeData()

  const toBoard = (rows: { id: number; title: string; createdAt: Date }[]) =>
    rows.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt.toISOString() }))

  const boardData = {
    notice: toBoard(notice),
    budget: toBoard(budget),
    qna: toBoard(qna),
  }

  const galleryItems = gallery.map((p) => ({
    id: p.id,
    title: p.title,
    thumbUrl: p.files[0]?.url ?? null,
  }))

  return (
    <>
      <HeroSlider slides={sliderImages} />
      <QuickAction />
      <section className="contentArea" id="community">
        <BoardPanel data={boardData} />
        <GalleryPanel items={galleryItems} />
      </section>
    </>
  )
}
