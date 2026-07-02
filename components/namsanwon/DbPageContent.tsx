import { prisma } from '@/lib/prisma'

// PageContent(slug)의 관리자 편집 HTML을 contentCard로 렌더
export default async function DbPageContent({ slug }: { slug: string }) {
  const page = await prisma.pageContent.findUnique({ where: { slug } })
  if (!page?.content) {
    return (
      <div className="contentCard">
        <p className="emptyNote">준비 중입니다.</p>
      </div>
    )
  }
  return <div className="contentCard" dangerouslySetInnerHTML={{ __html: page.content }} />
}
