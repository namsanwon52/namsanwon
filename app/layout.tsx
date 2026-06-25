import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: { default: '사회복지법인 남산원', template: '%s | 남산원' },
  description: '서울시 중구 소파로에 위치한 사회복지법인 남산원 공식 홈페이지입니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={notoSansKr.className}>{children}</body>
    </html>
  )
}
