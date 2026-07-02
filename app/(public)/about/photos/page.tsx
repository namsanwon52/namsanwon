import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '남산원 역사사진' }

export default function PhotosPage() {
  return (
    <>
      <PageBanner
        title="남산원 역사사진"
        desc="사진으로 만나는 남산원의 시간들입니다."
        crumbs={['남산원소개', '역사사진']}
      />
      <div className="subContent">
        <div className="contentCard">
          <p className="emptyNote">역사사진을 준비 중입니다.</p>
        </div>
      </div>
    </>
  )
}
