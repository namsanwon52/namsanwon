import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 사진첩' }
export const revalidate = 600

export default async function AlbumPage() {
  const posts = await prisma.post.findMany({
    where: { category: 'gallery' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { files: { take: 1 } },
  })

  return (
    <>
      <PageHeader title="아동 사진첩" breadcrumb={['남산 이야기', '아동 사진첩']} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-[#3D2B1F]/60">
            등록된 사진이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/board/gallery/${post.id}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                  {post.files[0] ? (
                    <Image
                      src={post.files[0].url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                  )}
                </div>
                <p className="mt-2 text-sm text-[#3D2B1F] truncate px-1">{post.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
