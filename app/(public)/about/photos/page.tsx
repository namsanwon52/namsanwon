import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import PageBanner from '@/components/namsanwon/PageBanner'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: '남산원 역사사진' }
export const dynamic = 'force-dynamic'

// File 썸네일이 없으면 본문 HTML의 첫 이미지 사용 (관리자 신규 등록 대비)
function firstImageFromContent(html: string): string | null {
  const m = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i)
  return m ? m[1] : null
}

export default async function PhotosPage() {
  const posts = await prisma.post.findMany({
    where: { code: 'com6' },
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: { files: { take: 1 } },
  })

  return (
    <>
      <PageBanner
        title="남산원 역사사진"
        desc="사진으로 만나는 남산원의 시간들입니다."
        crumbs={['남산원소개', '역사사진']}
      />
      <div className="subContent">
        {posts.length === 0 ? (
          <div className="contentCard">
            <p className="emptyNote">등록된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="albumGrid">
            {posts.map((post) => {
              const thumb = post.files[0]?.url ?? firstImageFromContent(post.content)
              return (
                <Link key={post.id} href={`/board/com6/${post.id}`} className="albumCard">
                  <span className="albumThumb">
                    {thumb ? (
                      <Image src={thumb} alt={post.title} fill sizes="(max-width: 560px) 50vw, 25vw" />
                    ) : null}
                  </span>
                  <strong>{post.title}</strong>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
