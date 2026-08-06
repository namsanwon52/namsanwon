import Link from 'next/link'
import PageBanner from '@/components/namsanwon/PageBanner'
import { getBoardMeta } from '@/lib/board'
import { getMemberSession } from '@/lib/memberSession'
import WriteForm from './WriteForm'

type Props = { params: Promise<{ category: string }> }

export default async function WritePage({ params }: Props) {
  const { category } = await params
  const meta = getBoardMeta(category)

  if (meta.adminOnly) {
    return (
      <div className="subContent">
        <div className="contentCard">
          <p className="emptyNote">관리자만 작성할 수 있는 게시판입니다.</p>
        </div>
      </div>
    )
  }

  const member = await getMemberSession()
  if (!member) {
    return (
      <>
        <PageBanner title={`${meta.label} 글쓰기`} crumbs={[meta.label, '글쓰기']} />
        <div className="subContent">
          <div className="contentCard">
            <p className="emptyNote">로그인한 회원만 글을 작성할 수 있습니다.</p>
            <div className="formActions" style={{ justifyContent: 'center' }}>
              <Link
                href={`/member/login?redirect=/board/${category}/write`}
                className="btnPrimary"
              >
                로그인하러 가기
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageBanner title={`${meta.label} 글쓰기`} crumbs={[meta.label, '글쓰기']} />
      <div className="subContent">
        <WriteForm category={category} authorName={member.name} />
      </div>
    </>
  )
}
