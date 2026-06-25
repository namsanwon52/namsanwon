'use client'

import { useState } from 'react'
import Link from 'next/link'

export type BoardPost = { id: number; title: string; createdAt: string }

const TABS = [
  { key: 'notice', label: '공지사항', code: 'nt1', moreHref: '/board/nt1' },
  { key: 'budget', label: '예산게시판', code: 'nt2', moreHref: '/board/nt2' },
  { key: 'qna', label: '질문과 답변', code: 'com1', moreHref: '/board/com1' },
] as const

type TabKey = (typeof TABS)[number]['key']

function formatDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function BoardPanel({ data }: { data: Record<TabKey, BoardPost[]> }) {
  const [active, setActive] = useState<TabKey>('notice')
  const activeTab = TABS.find((t) => t.key === active)!
  const posts = data[active] ?? []

  return (
    <div className="boardPanel" aria-labelledby="boardTitle">
      <div className="boardHeader">
        <div className="boardTabs" role="tablist" aria-label="게시판 분류">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={active === tab.key ? 'isActive' : ''}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              aria-controls="mainBoardList"
              id={active === tab.key ? 'boardTitle' : undefined}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          className="moreButton"
          href={activeTab.moreHref}
          aria-label={`${activeTab.label} 더보기`}
        />
      </div>

      <ul className="noticeList" id="mainBoardList" role="tabpanel" aria-labelledby="boardTitle">
        {posts.length === 0 ? (
          <li style={{ gridTemplateColumns: '1fr', color: 'var(--text-sub)' }}>
            <span>등록된 게시글이 없습니다.</span>
          </li>
        ) : (
          posts.map((post, idx) => (
            <li key={post.id}>
              <Link href={`/board/${activeTab.code}/${post.id}`}>
                <span>{post.title}</span>
                {idx < 2 && <em className="badgeNew">N</em>}
              </Link>
              <time dateTime={post.createdAt.slice(0, 10)}>{formatDate(post.createdAt)}</time>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
