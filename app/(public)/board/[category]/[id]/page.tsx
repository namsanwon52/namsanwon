import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { isBotUserAgent } from '@/lib/bot'
import { countView } from '@/lib/view-counter'
import { cachedQuery, CACHE_TAGS } from '@/lib/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBoardMeta, findBoardContext } from '@/lib/board'
import { canViewBoard, loginRedirectPath } from '@/lib/boardAccess'
import { rewritePostContent, imagesNotInContent } from '@/lib/content'
import { cldImage, optimizeHtmlImages } from '@/lib/cloudinary-url'
import { fileHref, isPdfFile } from '@/lib/file-url'
import PdfPreviews from '@/components/board/PdfPreviews'
import PageBanner from '@/components/namsanwon/PageBanner'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import PostActionsPublic from '@/components/board/PostActionsPublic'
import Comments from '@/components/board/Comments'
import SecretPost from '@/components/board/SecretPost'

type Props = { params: Promise<{ category: string; id: string }> }

// 게시글은 Data Cache에 저장하고(목록에 표시되는 조회수는 최대 1시간 늦게 반영될 수 있음),
// generateMetadata와 페이지 본문이 같은 요청 안에서 캐시를 한 번만 읽도록 React cache로 감싼다.
const getPost = cache(
  cachedQuery('post', [CACHE_TAGS.posts], (id: number) =>
    prisma.post.findUnique({
      where: { id },
      include: { files: true },
    })
  )
)

// 이전·다음 글. createdAt은 캐시 키에 들어가도록 ISO 문자열로 받는다.
const getAdjacentPosts = cachedQuery(
  'post-adjacent',
  [CACHE_TAGS.posts],
  (code: string, id: number, createdAtIso: string) => {
    const createdAt = new Date(createdAtIso)
    return Promise.all([
      prisma.post.findFirst({
        where: { code, createdAt: { lt: createdAt }, id: { not: id } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      }),
      prisma.post.findFirst({
        where: { code, createdAt: { gt: createdAt }, id: { not: id } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true },
      }),
    ])
  }
)

export async function generateMetadata({ params }: Props) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isInteger(id)) return { title: '게시글' }
  const post = await getPost(id)
  return { title: post?.title ?? '게시글' }
}

export default async function PostDetailPage({ params }: Props) {
  const { category, id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) notFound()
  if (!(await canViewBoard(category))) redirect(loginRedirectPath(`/board/${category}/${id}`))

  const post = await getPost(id)
  if (!post || post.code !== category) notFound()

  // 조회수 증가 (검색엔진·크롤러 요청은 세지 않는다)
  if (!isBotUserAgent((await headers()).get('user-agent'))) {
    countView(id) // 메모리에 모았다가 몰아서 반영 (lib/view-counter.ts)
  }

  const [prevPost, nextPost] = await getAdjacentPosts(category, id, post.createdAt.toISOString())

  const session = await getServerSession(authOptions)
  const ctx = findBoardContext(category)
  const meta = getBoardMeta(category)
  const crumbs = ctx ? [ctx.section.title, ctx.localItem.label] : [meta.label]

  // 첨부 분류: 이미지 중 본문에 아직 삽입되지 않은 것은 인라인으로, 문서 첨부는 다운로드 링크로
  const isImg = (n: string) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(n)
  const renderedContent = rewritePostContent(post.content, category, post.files)
  const inlineImages = imagesNotInContent(renderedContent, post.files)
  const docFiles = post.files.filter((f) => !isImg(f.filename))

  // 비밀글은 관리자 세션 여부와 무관하게 공개 게시판에서는 비밀번호를 입력해야 본문 열람 가능.
  // (관리자는 /admin/posts 에서 열람·관리)
  const isLocked = post.isSecret
  const allowComments = !meta.adminOnly // 자유게시판 등 공개 게시판에만 댓글

  return (
    <>
      <PageBanner title={ctx?.section.title ?? meta.label} desc={ctx?.section.desc} crumbs={crumbs} />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}

      <div className="boardArea">
        <div className="boardTitleRow">
          <h2 className="boardTitle">{ctx?.localItem.label ?? meta.label}</h2>
          <nav className="boardBreadcrumb" aria-label="현재 위치">
            <span aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
            {crumbs.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </nav>
        </div>

        <article className="postDetail">
          <div className="postDetailHead">
            <h2>{post.title}</h2>
            <div className="postDetailMeta">
              <span>{post.createdAt.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
              <span>{post.author ?? '-'}</span>
              
              <span> {post.views} views</span>
            </div>
          </div>

          {isLocked ? (
            <SecretPost id={id} category={category} />
          ) : (
            <>
              {/* 본문 글과 첨부 이미지를 한 박스 안에 넣는다 (모든 게시판 공통) */}
              <div className="postDetailBody">
                <div
                  className="postDetailText"
                  dangerouslySetInnerHTML={{ __html: optimizeHtmlImages(renderedContent) }}
                />

                {inlineImages.length > 0 && (
                  <div className="postImages">
                    {inlineImages.map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={f.id} src={cldImage(f.url, 1280)} alt={f.filename} loading="lazy" />
                    ))}
                  </div>
                )}

                {inlineImages.length === 0 && <PdfPreviews files={docFiles} />}
              </div>

              {docFiles.length > 0 && (
                <div style={{ padding: '16px 4px', borderBottom: '1px solid var(--line-muted)' }}>
                  <h3 style={{ fontSize: 'var(--font-h5)', fontWeight: 700, margin: '0 0 8px' }}>첨부파일</h3>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
                    {docFiles.map((f) => (
                      <li key={f.id}>
                        <a
                          href={fileHref(f)}
                          download={isPdfFile(f) ? undefined : f.filename}
                          target={isPdfFile(f) ? '_blank' : undefined}
                          rel={isPdfFile(f) ? 'noopener' : undefined}
                          style={{ color: 'var(--secondary)', fontSize: 'var(--font-h5)' }}
                        >
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
              <span className="navLabel isNext">다음글</span>
              <span className="navTitle">{nextPost.title}</span>
            </Link>
          )}
          {prevPost && (
            <Link href={`/board/${category}/${prevPost.id}`}>
              <span className="navLabel isPrev">이전글</span>
              <span className="navTitle">{prevPost.title}</span>
            </Link>
          )}
        </div>

        <div className="boardBackRow">
          <Link href={`/board/${category}`}>목록</Link>
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
