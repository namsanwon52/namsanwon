import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBoardMeta, findBoardContext } from '@/lib/board'
import { rewritePostContent } from '@/lib/content'
import PageBanner from '@/components/namsanwon/PageBanner'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import PostActionsPublic from '@/components/board/PostActionsPublic'
import Comments from '@/components/board/Comments'
import SecretPost from '@/components/board/SecretPost'

type Props = { params: Promise<{ category: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id: idStr } = await params
  const post = await prisma.post.findUnique({
    where: { id: Number(idStr) },
    select: { title: true },
  })
  return { title: post?.title ?? '게시글' }
}

export default async function PostDetailPage({ params }: Props) {
  const { category, id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) notFound()

  const post = await prisma.post.findUnique({
    where: { id },
    include: { files: true },
  })
  if (!post || post.code !== category) notFound()

  // 조회수 증가
  prisma.post.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { code: category, createdAt: { lt: post.createdAt }, id: { not: id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.post.findFirst({
      where: { code: category, createdAt: { gt: post.createdAt }, id: { not: id } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    }),
  ])

  const session = await getServerSession(authOptions)
  const ctx = findBoardContext(category)
  const meta = getBoardMeta(category)
  const crumbs = ctx ? [ctx.section.title, ctx.localItem.label] : [meta.label]

  // 첨부 분류: 이미지 중 본문에 아직 삽입되지 않은 것은 인라인으로, 문서 첨부는 다운로드 링크로
  const isImg = (n: string) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(n)
  const baseNoExt = (n: string) => n.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
  const inlineImages = post.files.filter(
    (f) => isImg(f.filename) && !post.content.includes(baseNoExt(f.filename)),
  )
  const docFiles = post.files.filter((f) => !isImg(f.filename))

  const isLocked = post.isSecret && !session // 비밀글 & 비관리자 → 게이트
  const allowComments = !meta.adminOnly // 자유게시판 등 공개 게시판에만 댓글

  return (
    <>
      <PageBanner title={ctx?.section.title ?? meta.label} desc={ctx?.section.desc} crumbs={crumbs} />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}

      <div className="boardArea">
        <article className="postDetail">
          <div className="postDetailHead">
            <h2>{post.title}</h2>
            <div className="postDetailMeta">
              <span>작성자 {post.author ?? '-'}</span>
              <span>작성일 {post.createdAt.toLocaleDateString('ko-KR')}</span>
              <span>조회 {post.views}</span>
            </div>
          </div>

          {isLocked ? (
            <SecretPost id={id} category={category} />
          ) : (
            <>
              <div
                className="postDetailBody"
                dangerouslySetInnerHTML={{ __html: rewritePostContent(post.content, category, post.files) }}
              />

              {inlineImages.length > 0 && (
                <div className="postImages">
                  {inlineImages.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={f.id} src={f.url} alt={f.filename} loading="lazy" />
                  ))}
                </div>
              )}

              {docFiles.length > 0 && (
                <div style={{ padding: '16px 4px', borderBottom: '1px solid var(--line-muted)' }}>
                  <h3 style={{ fontSize: 'var(--font-h5)', fontWeight: 700, margin: '0 0 8px' }}>첨부파일</h3>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
                    {docFiles.map((f) => (
                      <li key={f.id}>
                        <a href={f.url} download={f.filename} style={{ color: 'var(--secondary)', fontSize: 'var(--font-h5)' }}>
                          📎 {f.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {allowComments && <Comments postId={id} isAdmin={!!session} />}
            </>
          )}
        </article>

        <div className="postNav">
          {nextPost && (
            <Link href={`/board/${category}/${nextPost.id}`}>
              <span className="navLabel">다음글</span>
              <span className="navTitle">{nextPost.title}</span>
            </Link>
          )}
          {prevPost && (
            <Link href={`/board/${category}/${prevPost.id}`}>
              <span className="navLabel">이전글</span>
              <span className="navTitle">{prevPost.title}</span>
            </Link>
          )}
        </div>

        <div className="boardBackRow">
          <Link href={`/board/${category}`}>목록으로</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <PostActionsPublic
            id={id}
            category={category}
            isAdmin={!!session}
            hasPassword={!!post.password}
          />
        </div>
      </div>
    </>
  )
}
