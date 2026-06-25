import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import PostList from '@/components/board/PostList'
import Link from 'next/link'
import { getBoardMeta, BOARD_META } from '@/lib/board'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const meta = getBoardMeta(category)
  return { title: meta.label }
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { category } = await params
  const sp = await searchParams
  if (!Object.keys(BOARD_META).includes(category)) notFound()

  const meta = getBoardMeta(category)
  const page = Math.max(1, Number(sp.page ?? '1'))

  return (
    <>
      <PageHeader title={meta.label} breadcrumb={['게시판', meta.label]} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <PostList category={category} page={page} />
        </div>
        {!meta.adminOnly && (
          <div className="flex justify-end mt-4">
            <Link
              href={`/board/${category}/write`}
              className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e] transition-colors"
            >
              글쓰기
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
