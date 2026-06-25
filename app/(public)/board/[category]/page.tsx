import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BOARD_META, getBoardMeta, findBoardContext } from '@/lib/board'
import PageBanner from '@/components/namsanwon/PageBanner'
import BoardLocalNav from '@/components/namsanwon/BoardLocalNav'
import Pagination from '@/components/namsanwon/Pagination'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string; q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  return { title: getBoardMeta(category).label }
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ko-KR').replace(/\.$/, '')
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { category } = await params
  const sp = await searchParams
  if (!BOARD_META[category]) notFound()

  const page = Math.max(1, Number(sp.page ?? '1'))
  const q = (sp.q ?? '').trim()
  const ctx = findBoardContext(category)
  const meta = getBoardMeta(category)
  const isGallery = ctx?.localItem.type === 'gallery'
  const limit = isGallery ? 12 : 15
  const skip = (page - 1) * limit

  const where = {
    code: category,
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
  }

  const [total, listRows, galleryRows] = await Promise.all([
    prisma.post.count({ where }),
    isGallery
      ? Promise.resolve([])
      : prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: { id: true, title: true, author: true, createdAt: true, views: true },
        }),
    isGallery
      ? prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: { id: true, title: true, files: { take: 1, select: { url: true } } },
        })
      : Promise.resolve([]),
  ])

  const totalPages = Math.ceil(total / limit)
  const crumbs = ctx ? [ctx.section.title, ctx.localItem.label] : [meta.label]

  return (
    <>
      <PageBanner
        title={ctx?.section.title ?? meta.label}
        desc={ctx?.section.desc}
        crumbs={crumbs}
      />
      {ctx && <BoardLocalNav section={ctx.section} activeCode={ctx.localItem.code} />}

      <div className="boardArea">
        <div className="boardControlBar">
          {ctx?.localItem.subTabs ? (
            <div className="boardSubTabs">
              {ctx.localItem.subTabs.map((t) => (
                <Link
                  key={t.code}
                  href={`/board/${t.code}`}
                  className={t.code === category ? 'isActive' : ''}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          ) : (
            <div />
          )}
          <form className="boardSearch" action={`/board/${category}`} method="get">
            <input name="q" defaultValue={q} placeholder="검색어를 입력하세요" aria-label="게시글 검색" />
            <button type="submit" aria-label="검색">🔍</button>
          </form>
        </div>

        <p className="boardCount">
          총 <b>{total}</b>건{q && ` · "${q}" 검색 결과`}
        </p>

        {isGallery ? (
          galleryRows.length === 0 ? (
            <div className="boardEmpty">등록된 게시글이 없습니다.</div>
          ) : (
            <div className="boardGalleryGrid">
              {galleryRows.map((p) => (
                <Link href={`/board/${category}/${p.id}`} className="galleryCard" key={p.id}>
                  <span className="thumb" aria-hidden="true">
                    {p.files[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.files[0].url} alt="" loading="lazy" />
                    )}
                  </span>
                  <strong>{p.title}</strong>
                </Link>
              ))}
            </div>
          )
        ) : (
          <table className="boardTable">
            <thead>
              <tr>
                <th className="colNo">번호</th>
                <th className="colTitle">제목</th>
                <th className="colAuthor">작성자</th>
                <th className="colDate">작성일</th>
                <th className="colViews">조회</th>
              </tr>
            </thead>
            <tbody>
              {listRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="boardEmpty">등록된 게시글이 없습니다.</div>
                  </td>
                </tr>
              ) : (
                listRows.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="colNo">{total - skip - idx}</td>
                    <td className="colTitle">
                      <Link href={`/board/${category}/${p.id}`}>
                        <span className="titleText">{p.title}</span>
                        {idx < 2 && page === 1 && !q && <em className="badgeNew">N</em>}
                      </Link>
                    </td>
                    <td className="colAuthor">{p.author ?? '-'}</td>
                    <td className="colDate">{formatDate(p.createdAt)}</td>
                    <td className="colViews">{p.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <Pagination page={page} totalPages={totalPages} basePath={`/board/${category}`} query={q} />
      </div>
    </>
  )
}
