import { prisma } from '@/lib/prisma'
import { cldImage, optimizeHtmlImages, responsiveSrcSet } from '@/lib/cloudinary-url'

// ContentBlock(page)의 관리자 편집 블럭들을 contentCard 목록으로 렌더.
// hideWhenEmpty: 블럭이 없을 때 '준비 중입니다.' 대신 아무것도 렌더하지 않는다.
// (연혁처럼 본문이 다른 컴포넌트로 렌더되고 블럭은 선택적으로 덧붙이는 페이지용)
export default async function PageBlocks({
  page,
  hideWhenEmpty = false,
}: {
  page: string
  hideWhenEmpty?: boolean
}) {
  const blocks = await prisma.contentBlock.findMany({
    where: { page, active: true },
    orderBy: { order: 'asc' },
  })

  if (blocks.length === 0) {
    if (hideWhenEmpty) return null

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
            <div dangerouslySetInnerHTML={{ __html: optimizeHtmlImages(block.content) }} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={block.id}
            src={cldImage(block.imageUrl, 1600)}
            srcSet={responsiveSrcSet(block.imageUrl)}
            sizes="(max-width: 1280px) 100vw, 1280px"
            alt={block.imageAlt}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )
      )}
    </>
  )
}
