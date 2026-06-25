// app/admin/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

const ADMIN_MENU = [
  { label: '대시보드', href: '/admin' },
  { label: '게시글 관리', href: '/admin/posts' },
  { label: '슬라이더 관리', href: '/admin/slider' },
  { label: '후원금품현황', href: '/admin/donation-records' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-[#3D2B1F] text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-[#F5C842]">남산원 관리자</h2>
          <p className="text-xs text-gray-400 mt-1">{session?.user?.email}</p>
        </div>
        <nav className="flex-1 p-2">
          {ADMIN_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <a
            href="/api/auth/signout"
            className="text-xs text-gray-400 hover:text-white"
          >
            로그아웃
          </a>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
