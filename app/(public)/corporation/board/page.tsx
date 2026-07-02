import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PostList from '@/components/board/PostList'

export const metadata: Metadata = { title: '법인게시판' }

type Props = { searchParams: Promise<{ page?: string }> }

export default async function CorporationBoardPage({ searchParams }: Props) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage ?? '1'))
  return (
    <>
      <PageBanner
        title="법인게시판"
        desc="사회복지법인 남산원의 법인 관련 소식입니다."
        crumbs={['사회복지법인 남산원', '법인게시판']}
      />
      <div className="subContent">
        <PostList category="nt4" page={page} />
      </div>
    </>
  )
}
