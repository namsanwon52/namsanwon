import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMemberSession } from '@/lib/memberSession'
import { getBoardMeta } from '@/lib/board'
import { prisma } from '@/lib/prisma'

/** 로그인 필요 게시판(loginRequired)이면 회원 또는 관리자 세션이 있어야 열람 가능 */
export async function canViewBoard(code: string): Promise<boolean> {
  if (!getBoardMeta(code).loginRequired) return true
  if (await getMemberSession()) return true
  return !!(await getServerSession(authOptions))
}

export function loginRedirectPath(path: string): string {
  return `/member/login?redirect=${encodeURIComponent(path)}`
}

export type BoardWriter =
  | { kind: 'admin'; name: string } // 관리자 화면(NextAuth) 로그인
  | { kind: 'adminMember'; name: string; idx: number } // 회원 등급이 '관리자'
  | { kind: 'member'; name: string; idx: number } // 일반 회원

/**
 * 현재 사용자의 글쓰기 자격.
 * 회원 등급(관리자/일반)은 쿠키가 아니라 DB에서 읽는다 — 관리자 화면에서 등급을 바꾸면 바로 반영된다.
 */
export async function getWriter({ includeAdminSession = true } = {}): Promise<BoardWriter | null> {
  const member = await getMemberSession()
  if (member) {
    const row = await prisma.member.findUnique({
      where: { idx: member.idx },
      select: { isAdmin: true, name: true },
    })
    if (row) {
      const name = row.name || member.name
      return row.isAdmin
        ? { kind: 'adminMember', name, idx: member.idx }
        : { kind: 'member', name, idx: member.idx }
    }
  }
  if (includeAdminSession && (await getServerSession(authOptions))) return { kind: 'admin', name: '관리자' }
  return null
}

export const isAdminWriter = (w: BoardWriter | null) => w?.kind === 'admin' || w?.kind === 'adminMember'

/**
 * 이 게시판에 글을 쓸 수 있는 사용자면 반환. 관리자 전용 게시판은 관리자·관리자 등급 회원만.
 * 앞 화면(글쓰기 버튼·글쓰기 페이지)은 회원 로그인만 본다(memberOnly) —
 * 같은 브라우저에 관리자 화면 로그인이 남아 있어도 앞 화면에서 로그아웃하면 버튼이 사라져야 한다.
 * 등록 API는 관리자 화면 글쓰기도 받아야 하므로 관리자 화면 로그인도 인정한다.
 */
export async function getBoardWriter(code: string, { memberOnly = false } = {}): Promise<BoardWriter | null> {
  const writer = await getWriter({ includeAdminSession: !memberOnly })
  if (!writer) return null
  if (getBoardMeta(code).adminOnly && !isAdminWriter(writer)) return null
  return writer
}
