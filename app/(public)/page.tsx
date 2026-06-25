import { prisma } from '@/lib/prisma'
import HeroSlider from '@/components/namsanwon/HeroSlider'
import QuickAction from '@/components/namsanwon/QuickAction'
import BoardPanel from '@/components/namsanwon/BoardPanel'
import GalleryPanel from '@/components/namsanwon/GalleryPanel'

export const revalidate = 600

const listSelect = { id: true, title: true, createdAt: true } as const

export default async function HomePage() {
  const [notice, budget, qna, gallery] = await Promise.all([
    prisma.post.findMany({ where: { code: 'nt1' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({ where: { code: 'nt2' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({ where: { code: 'com1' }, orderBy: { createdAt: 'desc' }, take: 5, select: listSelect }),
    prisma.post.findMany({
      where: { code: 'com3' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, files: { take: 1, select: { url: true } } },
    }),
  ])

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
      <HeroSlider />
      <QuickAction />
      <section className="contentArea" id="community">
        <BoardPanel data={boardData} />
        <GalleryPanel items={galleryItems} />
      </section>
    </>
  )
}
