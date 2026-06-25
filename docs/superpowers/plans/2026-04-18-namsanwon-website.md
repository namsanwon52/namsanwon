# 남산원 홈페이지 구현 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사회복지법인 남산원의 홈페이지를 Next.js 14 + MySQL + Prisma 기반으로 구축한다.

**Architecture:** App Router 기반 Next.js 단일 프로젝트로 공개 페이지와 관리자 페이지를 모두 포함한다. Prisma ORM으로 MySQL에 접근하며 NextAuth.js로 관리자 인증을 처리한다. 게시판은 category 필드로 분류하는 통합 Post 테이블을 사용한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, MySQL, NextAuth.js, Jest, React Testing Library

---

## 파일 구조 개요

```
namsan_home/
├── app/
│   ├── layout.tsx                          # 루트 레이아웃
│   ├── (public)/
│   │   ├── layout.tsx                      # 공개 레이아웃 (Header + Footer)
│   │   ├── page.tsx                        # 메인 홈
│   │   ├── about/
│   │   │   ├── greeting/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── status/page.tsx
│   │   │   ├── facility/page.tsx
│   │   │   ├── directions/page.tsx
│   │   │   └── photos/page.tsx
│   │   ├── business/
│   │   │   ├── admin-support/donation/page.tsx
│   │   │   ├── admin-support/nutrition/page.tsx
│   │   │   ├── independence/page.tsx
│   │   │   ├── child-support/education/page.tsx
│   │   │   └── child-support/care/page.tsx
│   │   ├── story/
│   │   │   ├── news/page.tsx
│   │   │   └── album/page.tsx
│   │   ├── support/
│   │   │   ├── donation/page.tsx
│   │   │   └── volunteer/page.tsx
│   │   ├── board/[category]/
│   │   │   ├── page.tsx                    # 게시판 목록
│   │   │   ├── [id]/page.tsx               # 게시글 상세
│   │   │   └── write/page.tsx              # 글쓰기
│   │   └── corporation/board/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                      # 관리자 레이아웃 (인증 가드)
│   │   ├── page.tsx                        # 대시보드
│   │   ├── posts/page.tsx
│   │   ├── slider/page.tsx
│   │   └── donation-records/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── posts/route.ts                  # GET(목록) POST(작성)
│       ├── posts/[id]/route.ts             # GET PUT DELETE
│       ├── posts/[id]/verify/route.ts      # 비밀번호 확인
│       ├── slider/route.ts
│       ├── slider/[id]/route.ts
│       ├── donation-records/route.ts
│       └── upload/route.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── home/
│   │   ├── ImageSlider.tsx
│   │   ├── QuickLinks.tsx
│   │   └── RecentPostsSection.tsx
│   └── board/
│       ├── PostList.tsx
│       ├── PostDetail.tsx
│       └── PostForm.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── hash.ts
│   └── board.ts
├── prisma/
│   └── schema.prisma
├── public/images/
│   └── (슬라이더 이미지 7장)
└── __tests__/
    ├── lib/hash.test.ts
    ├── api/posts.test.ts
    └── components/PostList.test.tsx
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local`
- Create: `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/woojuman/project/namsan_home
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

- [ ] **Step 2: 추가 패키지 설치**

```bash
npm install prisma @prisma/client next-auth bcryptjs
npm install --save-dev @types/bcryptjs jest jest-environment-jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event ts-jest
```

- [ ] **Step 3: jest.config.ts 생성**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: jest.setup.ts 생성**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: .env.local 생성**

```bash
# .env.local
DATABASE_URL="mysql://root:password@localhost:3306/namsanwon"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@namsanwon.or.kr"
ADMIN_PASSWORD_HASH=""   # Task 3에서 bcrypt 해시로 채움
```

- [ ] **Step 6: public/images 디렉토리에 슬라이더 이미지 복사**

```bash
cp /Users/woojuman/project/namsan_home/images/* \
   /Users/woojuman/project/namsan_home/public/images/
# 파일명 공백 제거
cd public/images
mv "KakaoTalk_Photo_2026-04-18-10-43-08 001.jpeg" slider-001.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 002.jpeg" slider-002.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 003.jpeg" slider-003.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 004.jpeg" slider-004.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 005.jpeg" slider-005.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 006.jpeg" slider-006.jpeg
mv "KakaoTalk_Photo_2026-04-18-10-43-09 007.jpeg" slider-007.jpeg
```

- [ ] **Step 7: 개발 서버 구동 확인**

```bash
npm run dev
```
Expected: `http://localhost:3000` 에서 Next.js 기본 페이지 확인

- [ ] **Step 8: 커밋**

```bash
git init
git add .
git commit -m "chore: Next.js 14 프로젝트 초기화 (Tailwind, Prisma, NextAuth, Jest)"
```

---

## Task 2: Prisma DB 스키마 및 마이그레이션

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Prisma 초기화**

```bash
npx prisma init --datasource-provider mysql
```

- [ ] **Step 2: schema.prisma 작성**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Admin {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  category  String
  title     String
  content   String   @db.LongText
  author    String
  password  String?
  isAdmin   Boolean  @default(false)
  views     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     File[]

  @@index([category])
}

model File {
  id       Int    @id @default(autoincrement())
  postId   Int
  post     Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  url      String
  filename String
}

model DonationRecord {
  id        Int      @id @default(autoincrement())
  year      Int
  month     Int
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@unique([year, month])
}

model SliderImage {
  id     Int     @id @default(autoincrement())
  url    String
  alt    String
  order  Int
  active Boolean @default(true)
}
```

- [ ] **Step 3: MySQL DB 생성 및 마이그레이션**

```bash
mysql -u root -p -e "CREATE DATABASE namsanwon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx prisma migrate dev --name init
```
Expected: `✔ Generated Prisma Client` 출력

- [ ] **Step 4: lib/prisma.ts 생성**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: 슬라이더 초기 데이터 시딩**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sliders = [
    { url: '/images/slider-001.jpeg', alt: '남산원 전경 1', order: 1 },
    { url: '/images/slider-002.jpeg', alt: '남산원 전경 2', order: 2 },
    { url: '/images/slider-003.jpeg', alt: '남산원 전경 3', order: 3 },
    { url: '/images/slider-004.jpeg', alt: '남산원 전경 4', order: 4 },
    { url: '/images/slider-005.jpeg', alt: '남산원 일러스트 1', order: 5 },
    { url: '/images/slider-006.jpeg', alt: '남산원 일러스트 2', order: 6 },
    { url: '/images/slider-007.jpeg', alt: '남산원 일러스트 3', order: 7 },
  ]
  for (const s of sliders) {
    await prisma.sliderImage.upsert({
      where: { id: s.order },
      update: s,
      create: s,
    })
  }
  console.log('Slider seeded')
}

main().finally(() => prisma.$disconnect())
```

```bash
# package.json의 prisma.seed 추가 후 실행
npx ts-node prisma/seed.ts
```

- [ ] **Step 6: 커밋**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: Prisma 스키마 설정 및 MySQL 마이그레이션"
```

---

## Task 3: 유틸리티 함수 및 인증 설정

**Files:**
- Create: `lib/hash.ts`
- Create: `lib/auth.ts`
- Create: `lib/board.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `__tests__/lib/hash.test.ts`

- [ ] **Step 1: hash.test.ts 작성 (TDD - 먼저 실패하는 테스트)**

```typescript
// __tests__/lib/hash.test.ts
import { hashPassword, verifyPassword } from '@/lib/hash'

describe('hashPassword', () => {
  it('비밀번호를 bcrypt 해시로 변환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(hash).not.toBe('test1234')
    expect(hash).toMatch(/^\$2[ab]\$/)
  })
})

describe('verifyPassword', () => {
  it('올바른 비밀번호는 true를 반환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(await verifyPassword('test1234', hash)).toBe(true)
  })

  it('잘못된 비밀번호는 false를 반환한다', async () => {
    const hash = await hashPassword('test1234')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/hash.test.ts
```
Expected: `Cannot find module '@/lib/hash'`

- [ ] **Step 3: lib/hash.ts 구현**

```typescript
// lib/hash.ts
import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/hash.test.ts
```
Expected: `3 passed`

- [ ] **Step 5: 관리자 초기 비밀번호 해시 생성**

```bash
node -e "const b=require('bcryptjs'); b.hash('namsan2024!', 10).then(h => console.log(h))"
```
Expected: `$2b$10$...` 형태의 해시 출력 → `.env.local`의 `ADMIN_PASSWORD_HASH`에 붙여넣기

- [ ] **Step 6: lib/auth.ts 작성**

```typescript
// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyPassword } from './hash'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        })
        if (!admin) return null
        const valid = await verifyPassword(credentials.password, admin.password)
        if (!valid) return null
        return { id: String(admin.id), email: admin.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
```

- [ ] **Step 7: NextAuth API Route 생성**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 8: lib/board.ts (카테고리 메타데이터) 작성**

```typescript
// lib/board.ts
export const BOARD_META: Record<string, { label: string; adminOnly: boolean }> = {
  notice:      { label: '공지사항',    adminOnly: true },
  job:         { label: '채용공고',    adminOnly: true },
  free:        { label: '자유게시판',  adminOnly: false },
  foreign:     { label: '외국인게시판', adminOnly: false },
  gallery:     { label: '후원·봉사 갤러리', adminOnly: true },
  corporation: { label: '법인게시판',  adminOnly: true },
}

export function getBoardMeta(category: string) {
  return BOARD_META[category] ?? { label: '게시판', adminOnly: false }
}
```

- [ ] **Step 9: 관리자 계정 DB 시딩**

```typescript
// prisma/seed.ts 아래에 추가
import { hashPassword } from '../lib/hash'

// main() 함수 내에 추가
const passwordHash = await hashPassword(process.env.ADMIN_INITIAL_PASSWORD ?? 'namsan2024!')
await prisma.admin.upsert({
  where: { email: 'admin@namsanwon.or.kr' },
  update: {},
  create: { email: 'admin@namsanwon.or.kr', password: passwordHash },
})
console.log('Admin seeded')
```

```bash
npx ts-node prisma/seed.ts
```

- [ ] **Step 10: 커밋**

```bash
git add lib/ app/api/auth/ __tests__/lib/ prisma/seed.ts
git commit -m "feat: 인증 설정 및 유틸리티 함수 구현"
```

---

## Task 4: 레이아웃 컴포넌트

**Files:**
- Create: `app/layout.tsx`
- Create: `app/(public)/layout.tsx`
- Create: `components/layout/Header.tsx`
- Create: `components/layout/Navigation.tsx`
- Create: `components/layout/Footer.tsx`

- [ ] **Step 1: 루트 레이아웃**

```typescript
// app/layout.tsx
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
```

- [ ] **Step 2: Navigation 메뉴 데이터 정의 (components/layout/Navigation.tsx)**

```typescript
// components/layout/Navigation.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV_ITEMS = [
  {
    label: '기관소개',
    children: [
      { label: '인사말', href: '/about/greeting' },
      { label: '연혁', href: '/about/history' },
      { label: '현황', href: '/about/status' },
      { label: '시설안내', href: '/about/facility' },
      { label: '오시는 길', href: '/about/directions' },
      { label: '역사사진', href: '/about/photos' },
    ],
  },
  {
    label: '사업소개',
    children: [
      { label: '후원금품현황', href: '/business/admin-support/donation' },
      { label: '영양소식', href: '/business/admin-support/nutrition' },
      { label: '자립지원', href: '/business/independence' },
      { label: '교육지원팀', href: '/business/child-support/education' },
      { label: '보육지원팀', href: '/business/child-support/care' },
    ],
  },
  {
    label: '남산 이야기',
    children: [
      { label: '아동 소식', href: '/story/news' },
      { label: '아동 사진첩', href: '/story/album' },
    ],
  },
  {
    label: '후원/자원봉사',
    children: [
      { label: '후원안내', href: '/support/donation' },
      { label: '자원봉사 안내', href: '/support/volunteer' },
    ],
  },
  {
    label: '게시판',
    children: [
      { label: '공지사항', href: '/board/notice' },
      { label: '채용공고', href: '/board/job' },
      { label: '자유게시판', href: '/board/free' },
      { label: '외국인게시판', href: '/board/foreign' },
      { label: '후원·봉사 갤러리', href: '/board/gallery' },
    ],
  },
  {
    label: '사회복지법인',
    children: [
      { label: '법인게시판', href: '/corporation/board' },
    ],
  },
]

export default function Navigation() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map((item, idx) => (
        <div
          key={idx}
          className="relative group"
          onMouseEnter={() => setOpenIndex(idx)}
          onMouseLeave={() => setOpenIndex(null)}
        >
          <button className="px-4 py-2 text-[#3D2B1F] font-medium hover:text-[#E8863A] transition-colors">
            {item.label}
          </button>
          {openIndex === idx && (
            <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-lg min-w-[140px] z-50 border-t-2 border-[#E8863A]">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm text-[#3D2B1F] hover:bg-[#FFF8F0] hover:text-[#E8863A] transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Header.tsx 작성**

```typescript
// components/layout/Header.tsx
import Link from 'next/link'
import Navigation from './Navigation'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#E8863A]">사회복지법인</span>
          <span className="text-xl font-bold text-[#3D2B1F]">남산원</span>
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Footer.tsx 작성**

```typescript
// components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-[#3D2B1F] text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-[#F5C842] mb-3">사회복지법인 남산원</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            서울시 중구 소파로 2길 31 (우) 04628<br />
            전화: 02-752-9836 | 팩스: 02-755-9836<br />
            홈페이지: www.namsanwon.or.kr
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end justify-end">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 사회복지법인 남산원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: 공개 레이아웃 작성**

```typescript
// app/(public)/layout.tsx
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add app/layout.tsx app/'(public)'/layout.tsx components/layout/
git commit -m "feat: 공통 레이아웃 컴포넌트 구현 (Header, Navigation, Footer)"
```

---

## Task 5: 메인 홈 페이지

**Files:**
- Create: `components/home/ImageSlider.tsx`
- Create: `components/home/QuickLinks.tsx`
- Create: `components/home/RecentPostsSection.tsx`
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: ImageSlider.tsx 작성**

```typescript
// components/home/ImageSlider.tsx
'use client'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

type SliderImage = { id: number; url: string; alt: string }

export default function ImageSlider({ images }: { images: SliderImage[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (!images.length) return null

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {images.map((img, idx) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            className="object-cover"
            priority={idx === 0}
          />
        </div>
      ))}
      {/* 이전/다음 버튼 */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
        aria-label="이전 슬라이드"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
        aria-label="다음 슬라이드"
      >
        ›
      </button>
      {/* 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              idx === current ? 'bg-[#E8863A]' : 'bg-white/60'
            }`}
            aria-label={`슬라이드 ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: QuickLinks.tsx 작성**

```typescript
// components/home/QuickLinks.tsx
import Link from 'next/link'

const QUICK_LINKS = [
  { label: '공지사항', href: '/board/notice', icon: '📢' },
  { label: '후원안내', href: '/support/donation', icon: '💛' },
  { label: '자원봉사', href: '/support/volunteer', icon: '🤝' },
  { label: '오시는 길', href: '/about/directions', icon: '📍' },
  { label: '채용공고', href: '/board/job', icon: '📋' },
]

export default function QuickLinks() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:border-[#E8863A] border-2 border-transparent transition-all"
          >
            <span className="text-3xl">{link.icon}</span>
            <span className="text-sm font-medium text-[#3D2B1F]">{link.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: RecentPostsSection.tsx 작성**

```typescript
// components/home/RecentPostsSection.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getRecentPosts(category: string, limit = 5) {
  return prisma.post.findMany({
    where: { category },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, createdAt: true },
  })
}

export default async function RecentPostsSection() {
  const [notices, stories] = await Promise.all([
    getRecentPosts('notice'),
    getRecentPosts('free'),
  ])

  const Section = ({
    title, posts, href, category,
  }: { title: string; posts: { id: number; title: string; createdAt: Date }[]; href: string; category: string }) => (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-3 border-b border-[#E8863A] pb-2">
        <h3 className="font-bold text-[#3D2B1F]">{title}</h3>
        <Link href={href} className="text-xs text-[#E8863A] hover:underline">더보기</Link>
      </div>
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="flex justify-between text-sm">
            <Link href={`/board/${category}/${p.id}`} className="hover:text-[#E8863A] truncate max-w-[200px]">
              {p.title}
            </Link>
            <span className="text-gray-400 text-xs ml-2 whitespace-nowrap">
              {p.createdAt.toLocaleDateString('ko-KR')}
            </span>
          </li>
        ))}
        {posts.length === 0 && <li className="text-sm text-gray-400">게시글이 없습니다.</li>}
      </ul>
    </div>
  )

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="공지사항" posts={notices} href="/board/notice" category="notice" />
      <Section title="자유게시판" posts={stories} href="/board/free" category="free" />
    </section>
  )
}
```

- [ ] **Step 4: 메인 홈 page.tsx 작성**

```typescript
// app/(public)/page.tsx
import { prisma } from '@/lib/prisma'
import ImageSlider from '@/components/home/ImageSlider'
import QuickLinks from '@/components/home/QuickLinks'
import RecentPostsSection from '@/components/home/RecentPostsSection'

export default async function HomePage() {
  const sliderImages = await prisma.sliderImage.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })

  return (
    <>
      <ImageSlider images={sliderImages} />
      <QuickLinks />
      <RecentPostsSection />
      {/* 기관 소개 배너 */}
      <section className="bg-[#E8863A]/10 py-12 mt-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#3D2B1F] mb-3">사회복지법인 남산원</h2>
          <p className="text-[#3D2B1F]/70 max-w-xl mx-auto leading-relaxed">
            1950년대부터 서울 남산 자락에서 아동들의 건강한 성장과 자립을 지원해온 사회복지기관입니다.
          </p>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 5: 개발 서버에서 홈 확인**

```bash
npm run dev
```
Expected: `http://localhost:3000` 에서 슬라이더 + 퀵링크 + 최근글 섹션 확인

- [ ] **Step 6: 커밋**

```bash
git add components/home/ app/'(public)'/page.tsx
git commit -m "feat: 메인 홈 페이지 구현 (슬라이더, 퀵링크, 최근글 섹션)"
```

---

## Task 6: 기관소개 페이지

**Files:**
- Create: `app/(public)/about/greeting/page.tsx`
- Create: `app/(public)/about/history/page.tsx`
- Create: `app/(public)/about/status/page.tsx`
- Create: `app/(public)/about/facility/page.tsx`
- Create: `app/(public)/about/directions/page.tsx`
- Create: `app/(public)/about/photos/page.tsx`
- Create: `components/layout/PageHeader.tsx`

- [ ] **Step 1: 재사용 PageHeader 컴포넌트 작성**

```typescript
// components/layout/PageHeader.tsx
type Props = { title: string; breadcrumb: string[] }

export default function PageHeader({ title, breadcrumb }: Props) {
  return (
    <div className="bg-[#E8863A] text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-white/80 text-sm">{breadcrumb.join(' > ')}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 인사말 페이지 작성**

```typescript
// app/(public)/about/greeting/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '인사말' }

export default function GreetingPage() {
  return (
    <>
      <PageHeader title="인사말" breadcrumb={['기관소개', '인사말']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-[#E8863A] mb-6">원장 인사말</h2>
          <p className="text-[#3D2B1F]/80 leading-relaxed">
            {/* 실제 인사말 콘텐츠는 관리자가 입력 */}
            남산원 홈페이지를 방문해 주신 여러분을 진심으로 환영합니다.<br /><br />
            저희 남산원은 1953년 설립 이후 서울 남산 자락에서 아동들의 건강한 성장과
            자립을 위해 헌신해왔습니다. ...
          </p>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: 연혁 페이지 작성**

```typescript
// app/(public)/about/history/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '연혁' }

const HISTORY = [
  { year: '1953', events: ['남산원 설립'] },
  { year: '1960', events: ['보육시설 인가'] },
  { year: '1980', events: ['사회복지법인 인가'] },
  { year: '2000', events: ['홈페이지 개설'] },
  { year: '2024', events: ['시설 리모델링 완료'] },
  // 실제 연혁으로 교체 필요
]

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="연혁" breadcrumb={['기관소개', '연혁']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="relative border-l-4 border-[#E8863A] pl-8 space-y-8">
          {HISTORY.map((item) => (
            <div key={item.year} className="relative">
              <div className="absolute -left-[2.7rem] w-6 h-6 bg-[#E8863A] rounded-full border-4 border-white shadow" />
              <h3 className="text-xl font-bold text-[#E8863A] mb-1">{item.year}</h3>
              <ul className="list-disc list-inside space-y-1">
                {item.events.map((e) => (
                  <li key={e} className="text-[#3D2B1F]/80">{e}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: 현황 페이지 작성**

```typescript
// app/(public)/about/status/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '현황' }

export default function StatusPage() {
  return (
    <>
      <PageHeader title="현황" breadcrumb={['기관소개', '현황']} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {['기관 현황', '아동 현황', '직원 현황'].map((section) => (
          <section key={section} className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#E8863A] border-b border-[#E8863A]/30 pb-3 mb-4">{section}</h2>
            <p className="text-[#3D2B1F]/60 text-sm">관리자가 내용을 입력해주세요.</p>
          </section>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 5: 오시는 길 페이지 작성 (카카오맵 연동)**

```typescript
// app/(public)/about/directions/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: '오시는 길' }

export default function DirectionsPage() {
  return (
    <>
      <PageHeader title="오시는 길" breadcrumb={['기관소개', '오시는 길']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div
            className="w-full h-80 bg-gray-200 rounded-lg mb-6 flex items-center justify-center"
          >
            {/* 카카오맵 iframe 삽입 */}
            <iframe
              src="https://map.kakao.com/link/embed/namsanwon,37.558,126.975"
              className="w-full h-full rounded-lg"
              title="남산원 위치"
            />
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-bold text-[#E8863A]">주소</dt>
              <dd className="text-[#3D2B1F]/80">서울시 중구 소파로 2길 31 (우) 04628</dd>
            </div>
            <div>
              <dt className="font-bold text-[#E8863A]">전화</dt>
              <dd className="text-[#3D2B1F]/80">02-752-9836</dd>
            </div>
            <div>
              <dt className="font-bold text-[#E8863A]">팩스</dt>
              <dd className="text-[#3D2B1F]/80">02-755-9836</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 6: 나머지 정적 페이지 작성 (시설안내, 역사사진)**

`facility/page.tsx`, `photos/page.tsx`는 greeting 패턴과 동일하게 PageHeader + 콘텐츠 영역으로 구성. 사진 갤러리는 Task 8의 album 컴포넌트 재사용 가능.

```typescript
// app/(public)/about/facility/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
export const metadata: Metadata = { title: '시설안내' }
export default function FacilityPage() {
  return (
    <>
      <PageHeader title="시설안내" breadcrumb={['기관소개', '시설안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-[#3D2B1F]/60">시설 안내 내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
```

```typescript
// app/(public)/about/photos/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
export const metadata: Metadata = { title: '남산원 역사사진' }
export default function PhotosPage() {
  return (
    <>
      <PageHeader title="남산원 역사사진" breadcrumb={['기관소개', '역사사진']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-[#3D2B1F]/60">역사사진을 업로드해주세요.</p>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 7: 커밋**

```bash
git add app/'(public)'/about/ components/layout/PageHeader.tsx
git commit -m "feat: 기관소개 하위 페이지 구현"
```

---

## Task 7: 사업소개 + 남산이야기 + 후원 페이지

**Files:**
- Create: `app/(public)/business/**`
- Create: `app/(public)/story/**`
- Create: `app/(public)/support/**`

- [ ] **Step 1: 사업소개 페이지들 일괄 작성**

아래 패턴으로 5개 파일 모두 생성:

```typescript
// app/(public)/business/independence/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
export const metadata: Metadata = { title: '자립지원' }
export default function IndependencePage() {
  return (
    <>
      <PageHeader title="자립지원" breadcrumb={['사업소개', '자립지원']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">자립지원 사업 안내</h2>
          <p className="text-[#3D2B1F]/60">내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
```

나머지 파일:
- `business/admin-support/donation/page.tsx` → PageHeader: '후원금품현황' / `['사업소개', '행정지원', '후원금품현황']`
- `business/admin-support/nutrition/page.tsx` → '영양소식'
- `business/child-support/education/page.tsx` → '교육지원팀'
- `business/child-support/care/page.tsx` → '보육지원팀'

- [ ] **Step 2: 아동소식 페이지 작성**

```typescript
// app/(public)/story/news/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 소식' }

export default async function StoryNewsPage() {
  const posts = await prisma.post.findMany({
    where: { category: 'free' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, title: true, author: true, createdAt: true, views: true },
  })

  return (
    <>
      <PageHeader title="아동 소식" breadcrumb={['남산 이야기', '아동 소식']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FFF8F0] border-b-2 border-[#E8863A]">
              <tr>
                <th className="py-3 px-4 text-left text-[#3D2B1F]">제목</th>
                <th className="py-3 px-4 text-center text-[#3D2B1F] w-24">작성자</th>
                <th className="py-3 px-4 text-center text-[#3D2B1F] w-28">날짜</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-[#FFF8F0] transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/board/free/${p.id}`} className="hover:text-[#E8863A]">{p.title}</Link>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">{p.author}</td>
                  <td className="py-3 px-4 text-center text-gray-400">
                    {p.createdAt.toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: 아동 사진첩 페이지 작성**

```typescript
// app/(public)/story/album/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: '아동 사진첩' }

export default async function AlbumPage() {
  const posts = await prisma.post.findMany({
    where: { category: 'gallery' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { files: { take: 1 } },
  })

  return (
    <>
      <PageHeader title="아동 사진첩" breadcrumb={['남산 이야기', '아동 사진첩']} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/board/gallery/${post.id}`} className="group">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                {post.files[0] ? (
                  <Image src={post.files[0].url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                )}
              </div>
              <p className="mt-2 text-sm text-[#3D2B1F] truncate">{post.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: 후원/자원봉사 페이지 작성**

```typescript
// app/(public)/support/donation/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
export const metadata: Metadata = { title: '후원안내' }
export default function DonationPage() {
  return (
    <>
      <PageHeader title="후원안내" breadcrumb={['후원/자원봉사', '후원안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">후원 계좌 안내</h2>
          <div className="bg-[#FFF8F0] rounded-lg p-4 space-y-2 text-sm text-[#3D2B1F]">
            <p><strong>은행:</strong> 신한은행</p>
            <p><strong>계좌번호:</strong> 000-000-000000</p>
            <p><strong>예금주:</strong> 사회복지법인 남산원</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">후원 방법</h2>
          <p className="text-[#3D2B1F]/60">후원 안내 내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
```

```typescript
// app/(public)/support/volunteer/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
export const metadata: Metadata = { title: '자원봉사 안내' }
export default function VolunteerPage() {
  return (
    <>
      <PageHeader title="자원봉사 안내" breadcrumb={['후원/자원봉사', '자원봉사 안내']} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#E8863A] mb-4">자원봉사 신청 안내</h2>
          <p className="text-[#3D2B1F]/60">자원봉사 안내 내용을 입력해주세요.</p>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add app/'(public)'/business/ app/'(public)'/story/ app/'(public)'/support/
git commit -m "feat: 사업소개, 남산이야기, 후원/자원봉사 페이지 구현"
```

---

## Task 8: 게시판 API

**Files:**
- Create: `app/api/posts/route.ts`
- Create: `app/api/posts/[id]/route.ts`
- Create: `app/api/posts/[id]/verify/route.ts`
- Create: `__tests__/api/posts.test.ts`

- [ ] **Step 1: 게시판 API 테스트 작성 (TDD)**

```typescript
// __tests__/api/posts.test.ts
import { prisma } from '@/lib/prisma'

// 실제 DB 테스트 (테스트 DB 사용)
describe('Post API logic', () => {
  beforeEach(async () => {
    await prisma.post.deleteMany({ where: { category: 'test' } })
  })

  it('게시글을 생성할 수 있다', async () => {
    const post = await prisma.post.create({
      data: { category: 'test', title: '테스트', content: '내용', author: '작성자' },
    })
    expect(post.title).toBe('테스트')
    expect(post.views).toBe(0)
  })

  it('카테고리로 게시글을 필터링할 수 있다', async () => {
    await prisma.post.createMany({
      data: [
        { category: 'test', title: '글1', content: '', author: '작성자' },
        { category: 'notice', title: '공지', content: '', author: '관리자' },
      ],
    })
    const posts = await prisma.post.findMany({ where: { category: 'test' } })
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('글1')
  })
})
```

- [ ] **Step 2: 테스트 실행 확인**

```bash
npx jest __tests__/api/posts.test.ts
```
Expected: `2 passed`

- [ ] **Step 3: 게시판 목록/작성 API 작성**

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hashPassword } from '@/lib/hash'
import { getBoardMeta } from '@/lib/board'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'notice'
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 15
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, author: true, views: true, createdAt: true, isAdmin: true },
    }),
    prisma.post.count({ where: { category } }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { category, title, content, author, password } = body
  const meta = getBoardMeta(category)

  if (meta.adminOnly) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 401 })
  }

  const hashedPassword = password ? await hashPassword(password) : null

  const post = await prisma.post.create({
    data: {
      category,
      title,
      content,
      author: author || '익명',
      password: hashedPassword,
      isAdmin: !!(await getServerSession(authOptions)),
    },
  })

  return NextResponse.json(post, { status: 201 })
}
```

- [ ] **Step 4: 게시글 상세/수정/삭제 API 작성**

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: { files: true },
  })
  if (!post) return NextResponse.json({ error: '없는 게시글' }, { status: 404 })

  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } })

  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  await prisma.post.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: 비밀번호 확인 API (자유게시판 수정/삭제용)**

```typescript
// app/api/posts/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/hash'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { password } = await req.json()
  const post = await prisma.post.findUnique({ where: { id: Number(params.id) } })
  if (!post?.password) return NextResponse.json({ error: '비밀번호 없음' }, { status: 400 })

  const valid = await verifyPassword(password, post.password)
  if (!valid) return NextResponse.json({ error: '비밀번호 불일치' }, { status: 403 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: 커밋**

```bash
git add app/api/posts/ __tests__/api/
git commit -m "feat: 게시판 CRUD API 구현"
```

---

## Task 9: 게시판 공개 페이지

**Files:**
- Create: `components/board/PostList.tsx`
- Create: `components/board/PostDetail.tsx`
- Create: `components/board/PostForm.tsx`
- Create: `app/(public)/board/[category]/page.tsx`
- Create: `app/(public)/board/[category]/[id]/page.tsx`
- Create: `app/(public)/board/[category]/write/page.tsx`
- Create: `app/(public)/corporation/board/page.tsx`

- [ ] **Step 1: PostList 컴포넌트 작성**

```typescript
// components/board/PostList.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getBoardMeta } from '@/lib/board'

type Props = { category: string; page: number }

export default async function PostList({ category, page }: Props) {
  const limit = 15
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, author: true, views: true, createdAt: true, isAdmin: true },
    }),
    prisma.post.count({ where: { category } }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-[#FFF8F0] border-b-2 border-[#E8863A]">
          <tr>
            <th className="py-3 px-4 text-center w-16">번호</th>
            <th className="py-3 px-4 text-left">제목</th>
            <th className="py-3 px-4 text-center w-24">작성자</th>
            <th className="py-3 px-4 text-center w-28">날짜</th>
            <th className="py-3 px-4 text-center w-16">조회</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p, idx) => (
            <tr key={p.id} className="border-b hover:bg-[#FFF8F0]">
              <td className="py-3 px-4 text-center text-gray-400">{total - skip - idx}</td>
              <td className="py-3 px-4">
                <Link href={`/board/${category}/${p.id}`} className="hover:text-[#E8863A]">
                  {p.isAdmin && <span className="text-[#E8863A] font-bold mr-1">[공지]</span>}
                  {p.title}
                </Link>
              </td>
              <td className="py-3 px-4 text-center text-gray-500">{p.author}</td>
              <td className="py-3 px-4 text-center text-gray-400">
                {p.createdAt.toLocaleDateString('ko-KR')}
              </td>
              <td className="py-3 px-4 text-center text-gray-400">{p.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={`?page=${p}`}
            className={`w-8 h-8 flex items-center justify-center rounded ${
              p === page ? 'bg-[#E8863A] text-white' : 'bg-white border hover:border-[#E8863A]'
            } text-sm`}
          >
            {p}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 게시판 목록 페이지 작성**

```typescript
// app/(public)/board/[category]/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import PostList from '@/components/board/PostList'
import Link from 'next/link'
import { getBoardMeta } from '@/lib/board'

type Props = { params: { category: string }; searchParams: { page?: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meta = getBoardMeta(params.category)
  return { title: meta.label }
}

export default function BoardPage({ params, searchParams }: Props) {
  const meta = getBoardMeta(params.category)
  const page = Number(searchParams.page ?? '1')

  return (
    <>
      <PageHeader title={meta.label} breadcrumb={['게시판', meta.label]} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-2">
          <PostList category={params.category} page={page} />
        </div>
        {!meta.adminOnly && (
          <div className="flex justify-end mt-4">
            <Link
              href={`/board/${params.category}/write`}
              className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e] transition-colors"
            >
              글쓰기
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: 게시글 상세 페이지 작성**

```typescript
// app/(public)/board/[category]/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { getBoardMeta } from '@/lib/board'
import { notFound } from 'next/navigation'

type Props = { params: { category: string; id: string } }

export default async function PostDetailPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: { files: true },
  })
  if (!post) notFound()

  const meta = getBoardMeta(params.category)

  return (
    <>
      <PageHeader title={meta.label} breadcrumb={['게시판', meta.label]} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-[#3D2B1F] border-b-2 border-[#E8863A] pb-3 mb-4">
            {post.title}
          </h2>
          <div className="flex gap-4 text-sm text-gray-400 mb-6">
            <span>작성자: {post.author}</span>
            <span>날짜: {post.createdAt.toLocaleDateString('ko-KR')}</span>
            <span>조회: {post.views}</span>
          </div>
          <div
            className="prose max-w-none text-[#3D2B1F]/80 min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {post.files.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-bold text-[#3D2B1F] mb-2">첨부파일</h3>
              <ul className="space-y-1">
                {post.files.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} className="text-sm text-[#E8863A] hover:underline" download>
                      {f.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-4">
          <Link href={`/board/${params.category}`} className="text-sm text-gray-500 hover:text-[#E8863A]">
            ← 목록으로
          </Link>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: 글쓰기 페이지 작성 (자유게시판/외국인게시판)**

```typescript
// app/(public)/board/[category]/write/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { getBoardMeta } from '@/lib/board'

type Props = { params: { category: string } }

export default function WritePage({ params }: Props) {
  const meta = getBoardMeta(params.category)
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '', author: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (meta.adminOnly) return <div className="p-8 text-center">관리자만 작성할 수 있습니다.</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, category: params.category }),
    })
    if (res.ok) {
      const post = await res.json()
      router.push(`/board/${params.category}/${post.id}`)
    }
    setLoading(false)
  }

  return (
    <>
      <PageHeader title={`${meta.label} 글쓰기`} breadcrumb={['게시판', meta.label, '글쓰기']} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="작성자"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
            <input
              type="password"
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A]"
              placeholder="비밀번호 (수정/삭제시 필요)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#E8863A] h-48 resize-none"
            placeholder="내용"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#E8863A] text-white rounded-lg hover:bg-[#d4762e] disabled:opacity-50"
            >
              {loading ? '저장 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
```

- [ ] **Step 5: 법인게시판 페이지 작성**

```typescript
// app/(public)/corporation/board/page.tsx
import type { Metadata } from 'next'
import PageHeader from '@/components/layout/PageHeader'
import PostList from '@/components/board/PostList'

export const metadata: Metadata = { title: '법인게시판' }

type Props = { searchParams: { page?: string } }

export default function CorporationBoardPage({ searchParams }: Props) {
  const page = Number(searchParams.page ?? '1')
  return (
    <>
      <PageHeader title="법인게시판" breadcrumb={['사회복지법인 남산원', '법인게시판']} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-2">
          <PostList category="corporation" page={page} />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add components/board/ app/'(public)'/board/ app/'(public)'/corporation/
git commit -m "feat: 게시판 공개 페이지 구현 (목록, 상세, 글쓰기)"
```

---

## Task 10: 파일 업로드 API

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: 업로드 디렉토리 생성**

```bash
mkdir -p public/uploads
echo "uploads/*" >> .gitignore
echo "!uploads/.gitkeep" >> .gitignore
touch public/uploads/.gitkeep
```

- [ ] **Step 2: 파일 업로드 API 작성**

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
  const filepath = path.join(uploadDir, filename)
  await writeFile(filepath, buffer)

  return NextResponse.json({ url: `/uploads/${filename}`, filename: file.name })
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/upload/ public/uploads/.gitkeep .gitignore
git commit -m "feat: 파일 업로드 API 구현"
```

---

## Task 11: 관리자 레이아웃 및 로그인

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: 관리자 로그인 페이지 작성**

```typescript
// app/admin/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await signIn('credentials', { ...form, redirect: false })
    if (res?.ok) {
      router.push('/admin')
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#3D2B1F] text-center mb-6">관리자 로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[#E8863A]"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[#E8863A]"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#E8863A] text-white py-2 rounded-lg font-medium hover:bg-[#d4762e] transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 관리자 레이아웃 (인증 가드 포함)**

```typescript
// app/admin/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

const ADMIN_MENU = [
  { label: '대시보드', href: '/admin' },
  { label: '게시글 관리', href: '/admin/posts' },
  { label: '슬라이더 관리', href: '/admin/slider' },
  { label: '후원금품현황', href: '/admin/donation-records' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-[#3D2B1F] text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-[#F5C842]">남산원 관리자</h2>
          <p className="text-xs text-gray-400 mt-1">{session.user?.email}</p>
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
          <form action={async () => { 'use server'; await import('next-auth/react') }}>
            <Link href="/api/auth/signout" className="text-xs text-gray-400 hover:text-white">
              로그아웃
            </Link>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/login/ app/admin/layout.tsx
git commit -m "feat: 관리자 로그인 및 레이아웃 구현"
```

---

## Task 12: 관리자 대시보드 및 게시글 관리

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/posts/page.tsx`

- [ ] **Step 1: 대시보드 페이지 작성**

```typescript
// app/admin/page.tsx
import { prisma } from '@/lib/prisma'
import { BOARD_META } from '@/lib/board'

export default async function AdminDashboard() {
  const counts = await Promise.all(
    Object.keys(BOARD_META).map(async (cat) => ({
      category: cat,
      label: BOARD_META[cat].label,
      count: await prisma.post.count({ where: { category: cat } }),
    }))
  )
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, category: true, title: true, createdAt: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">대시보드</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {counts.map((c) => (
          <div key={c.category} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold text-[#E8863A] mt-1">{c.count}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-[#3D2B1F] mb-3">최근 게시글</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b">
            <tr>
              <th className="pb-2 text-left">게시판</th>
              <th className="pb-2 text-left">제목</th>
              <th className="pb-2 text-right">날짜</th>
            </tr>
          </thead>
          <tbody>
            {recentPosts.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 text-gray-500">{BOARD_META[p.category]?.label ?? p.category}</td>
                <td className="py-2">{p.title}</td>
                <td className="py-2 text-right text-gray-400">
                  {p.createdAt.toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 게시글 관리 페이지 작성**

```typescript
// app/admin/posts/page.tsx
import { prisma } from '@/lib/prisma'
import { BOARD_META } from '@/lib/board'
import Link from 'next/link'
import DeletePostButton from './DeletePostButton'

type Props = { searchParams: { category?: string; page?: string } }

export default async function AdminPostsPage({ searchParams }: Props) {
  const category = searchParams.category ?? 'notice'
  const page = Number(searchParams.page ?? '1')
  const limit = 20
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, author: true, createdAt: true, views: true },
    }),
    prisma.post.count({ where: { category } }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3D2B1F]">게시글 관리</h1>
        <Link
          href={`/admin/posts/write?category=${category}`}
          className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e]"
        >
          글쓰기
        </Link>
      </div>
      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(BOARD_META).map(([cat, meta]) => (
          <Link
            key={cat}
            href={`/admin/posts?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm ${
              cat === category ? 'bg-[#E8863A] text-white' : 'bg-white border text-gray-600 hover:border-[#E8863A]'
            }`}
          >
            {meta.label}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-left">제목</th>
              <th className="py-3 px-4 text-center w-24">작성자</th>
              <th className="py-3 px-4 text-center w-28">날짜</th>
              <th className="py-3 px-4 text-center w-20">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{p.title}</td>
                <td className="py-3 px-4 text-center text-gray-500">{p.author}</td>
                <td className="py-3 px-4 text-center text-gray-400">
                  {p.createdAt.toLocaleDateString('ko-KR')}
                </td>
                <td className="py-3 px-4 text-center">
                  <DeletePostButton id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-400">총 {total}개</p>
    </div>
  )
}
```

- [ ] **Step 3: DeletePostButton 클라이언트 컴포넌트 작성**

```typescript
// app/admin/posts/DeletePostButton.tsx
'use client'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ id }: { id: number }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-500 hover:text-red-700 text-xs"
    >
      삭제
    </button>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add app/admin/page.tsx app/admin/posts/
git commit -m "feat: 관리자 대시보드 및 게시글 관리 페이지 구현"
```

---

## Task 13: 관리자 슬라이더 및 후원금품현황 관리

**Files:**
- Create: `app/api/slider/route.ts`
- Create: `app/api/slider/[id]/route.ts`
- Create: `app/api/donation-records/route.ts`
- Create: `app/admin/slider/page.tsx`
- Create: `app/admin/donation-records/page.tsx`

- [ ] **Step 1: 슬라이더 API 작성**

```typescript
// app/api/slider/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const images = await prisma.sliderImage.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(images)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const image = await prisma.sliderImage.create({ data: body })
  return NextResponse.json(image, { status: 201 })
}
```

```typescript
// app/api/slider/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const image = await prisma.sliderImage.update({ where: { id: Number(params.id) }, data: body })
  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  await prisma.sliderImage.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: 슬라이더 관리 페이지 작성**

```typescript
// app/admin/slider/page.tsx
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import SliderControls from './SliderControls'

export default async function AdminSliderPage() {
  const images = await prisma.sliderImage.findMany({ orderBy: { order: 'asc' } })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">슬라이더 이미지 관리</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={img.url} alt={img.alt} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3D2B1F]">{img.alt}</p>
              <p className="text-xs text-gray-400 mt-1">순서: {img.order}</p>
            </div>
            <SliderControls id={img.id} active={img.active} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

```typescript
// app/admin/slider/SliderControls.tsx
'use client'
import { useRouter } from 'next/navigation'

export default function SliderControls({ id, active }: { id: number; active: boolean }) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/slider/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1.5 rounded-full text-xs ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? '활성' : '비활성'}
    </button>
  )
}
```

- [ ] **Step 3: 후원금품현황 API 작성**

```typescript
// app/api/donation-records/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const records = await prisma.donationRecord.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await req.json()
  const record = await prisma.donationRecord.upsert({
    where: { year_month: { year: body.year, month: body.month } },
    update: { content: body.content },
    create: body,
  })
  return NextResponse.json(record, { status: 201 })
}
```

- [ ] **Step 4: 후원금품현황 관리 페이지 작성**

```typescript
// app/admin/donation-records/page.tsx
import { prisma } from '@/lib/prisma'
import DonationForm from './DonationForm'

export default async function AdminDonationPage() {
  const records = await prisma.donationRecord.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">후원금품현황 관리</h1>
      <DonationForm />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-center w-20">연도</th>
              <th className="py-3 px-4 text-center w-16">월</th>
              <th className="py-3 px-4 text-left">내용</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-3 px-4 text-center">{r.year}</td>
                <td className="py-3 px-4 text-center">{r.month}월</td>
                <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{r.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

```typescript
// app/admin/donation-records/DonationForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DonationForm() {
  const [form, setForm] = useState({ year: new Date().getFullYear(), month: 1, content: '' })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/donation-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.refresh()
    setForm({ ...form, content: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 flex gap-4 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">연도</label>
        <input
          type="number"
          className="border rounded-lg px-3 py-2 text-sm w-24"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">월</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={form.month}
          onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">내용</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="후원금품 내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-[#E8863A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4762e]"
      >
        저장
      </button>
    </form>
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add app/api/slider/ app/api/donation-records/ app/admin/slider/ app/admin/donation-records/
git commit -m "feat: 슬라이더·후원금품현황 관리 API 및 페이지 구현"
```

---

## Task 14: 전체 테스트 및 빌드 검증

**Files:**
- Modify: `__tests__/` (테스트 보완)

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx jest --coverage
```
Expected: 작성된 테스트 모두 통과

- [ ] **Step 2: TypeScript 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 프로덕션 빌드 확인**

```bash
npm run build
```
Expected: `✓ Compiled successfully` 출력, 빌드 에러 없음

- [ ] **Step 4: 로컬 프로덕션 서버 확인**

```bash
npm start
```
Expected: `http://localhost:3000` 에서 전체 페이지 정상 동작 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add .
git commit -m "chore: 전체 빌드 검증 완료"
```

---

## Task 15: 배포 설정

**Files:**
- Create: `ecosystem.config.js` (PM2 설정)
- Create: `nginx.conf` (Nginx 설정 참고용)

- [ ] **Step 1: .env.production 생성**

```bash
# .env.production (서버에서 직접 생성, git에 커밋 금지)
DATABASE_URL="mysql://namsanwon_user:strong_password@localhost:3306/namsanwon"
NEXTAUTH_SECRET="production-secret-key-random-string"
NEXTAUTH_URL="https://www.namsanwon.or.kr"
```

- [ ] **Step 2: PM2 설정 파일 작성**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'namsanwon',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

- [ ] **Step 3: Nginx 설정 참고 파일 작성**

```nginx
# nginx.conf (참고용)
server {
    listen 80;
    server_name www.namsanwon.or.kr namsanwon.or.kr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name www.namsanwon.or.kr;

    ssl_certificate /etc/letsencrypt/live/namsanwon.or.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/namsanwon.or.kr/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /path/to/namsan_home/public/uploads/;
    }
}
```

- [ ] **Step 4: 서버 배포 스크립트 작성**

```bash
# deploy.sh
#!/bin/bash
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --env production
```

- [ ] **Step 5: 최종 커밋**

```bash
git add ecosystem.config.js nginx.conf deploy.sh
git commit -m "chore: PM2/Nginx 배포 설정 추가"
```

---

## 스펙 커버리지 검증

| 요구사항 | 구현 태스크 |
|---|---|
| 메인 홈 슬라이더 (7장) | Task 5 |
| 기관소개 6개 하위 페이지 | Task 6 |
| 사업소개 5개 하위 페이지 | Task 7 |
| 남산 이야기 2개 페이지 | Task 7 |
| 후원/자원봉사 2개 페이지 | Task 7 |
| 게시판 6종 (공지/채용/자유/외국인/갤러리/법인) | Task 8-9 |
| 비밀번호 방식 게시판 | Task 8 (verify API), Task 9 |
| 관리자 전용 게시판 | Task 8 (adminOnly 체크) |
| 관리자 로그인 | Task 11 |
| 관리자 게시글 관리 | Task 12 |
| 관리자 슬라이더 관리 | Task 13 |
| 관리자 후원금품현황 관리 | Task 13 |
| 파일 업로드 | Task 10 |
| MySQL + Prisma | Task 2 |
| NextAuth 인증 | Task 3 |
| 반응형 (Tailwind) | Task 4-13 전체 |
| 배포 설정 | Task 15 |
