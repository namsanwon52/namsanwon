import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMemberSession } from '@/lib/memberSession'
import { getBoardMeta } from '@/lib/board'

/** 로그인 필요 게시판(loginRequired)이면 회원 또는 관리자 세션이 있어야 열람 가능 */
export async function canViewBoard(code: string): Promise<boolean> {
  if (!getBoardMeta(code).loginRequired) return true
  if (await getMemberSession()) return true
  return !!(await getServerSession(authOptions))
}

export function loginRedirectPath(path: string): string {
  return `/member/login?redirect=${encodeURIComponent(path)}`
}
