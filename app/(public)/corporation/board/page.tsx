import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import PostList from '@/components/board/PostList'

export const metadata: Metadata = { title: '법인게시판' }

type Props = { searchParams: Promise<{ page?: string }> }

export default async function CorporationBoardPage({ searchParams }: Props) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage ?? '1'))
  return (
    <>
      <PageHeader title="법인게시판" breadcrumb={['사회복지법인 남산원', '법인게시판']} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <PostList category="corporation" page={page} />
        </div>
      </div>
    </>
  )
}
