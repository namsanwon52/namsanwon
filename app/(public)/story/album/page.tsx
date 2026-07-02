import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 사진첩' }
export const revalidate = 600

export default async function AlbumPage() {
  const posts = await prisma.post.findMany({
    where: { code: 'com3' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { files: { take: 1 } },
  })

  return (
    <>
      <PageBanner
        title="아동 사진첩"
        desc="사진으로 전하는 남산원 아이들의 행복한 순간들입니다."
        crumbs={['남산 이야기', '아동 사진첩']}
      />
      <div className="subContent">
        {posts.length === 0 ? (
          <div className="contentCard">
            <p className="emptyNote">등록된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="albumGrid">
            {posts.map((post) => (
              <Link key={post.id} href={`/board/com3/${post.id}`} className="albumCard">
                <span className="albumThumb">
                  {post.files[0] ? (
                    <Image src={post.files[0].url} alt={post.title} fill sizes="(max-width: 560px) 50vw, 25vw" />
                  ) : null}
                </span>
                <strong>{post.title}</strong>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
