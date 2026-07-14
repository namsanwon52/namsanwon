import { prisma } from '@/lib/prisma'

// ContentBlock(page)의 관리자 편집 블럭들을 contentCard 목록으로 렌더
export default async function PageBlocks({ page }: { page: string }) {
  const blocks = await prisma.contentBlock.findMany({
    where: { page, active: true },
    orderBy: { order: 'asc' },
  })

  if (blocks.length === 0) {
    return (
      <div className="contentCard">
        <p className="emptyNote">준비 중입니다.</p>
      </div>
    )
  }

  return (
    <>
      {blocks.map((block) =>
        block.type === 'text' ? (
          <div className="contentCard" key={block.id}>
            {block.title && <h2>{block.title}</h2>}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={block.id}
            src={block.imageUrl}
            alt={block.imageAlt}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )
      )}
    </>
  )
}
