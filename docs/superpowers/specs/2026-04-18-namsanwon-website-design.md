# 사회복지법인 남산원 홈페이지 설계 문서

**작성일:** 2026-04-18  
**프로젝트:** 남산원 홈페이지 리뉴얼  
**참고 사이트:** http://www.mjhappy.com (명진들꽃사랑마을)  
**대상 도메인:** www.namsanwon.or.kr

---

## 1. 프로젝트 개요

사회복지법인 남산원(서울시 중구 소파로 2길 31)의 홈페이지를 Next.js 기반으로 리뉴얼한다. 기존 mjhappy.com의 구조를 참고하여 기관소개, 사업소개, 게시판, 후원 안내 등의 기능을 포함한다. 메인 슬라이더에는 준비된 7장의 이미지(3D 렌더링 4장 + 수채화 일러스트 3장)를 활용한다.

---

## 2. 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS |
| ORM | Prisma |
| 데이터베이스 | MySQL / MariaDB |
| 인증 | NextAuth.js (관리자 전용) |
| 파일 업로드 | Multer + 로컬 스토리지 (기본값, 추후 Cloudinary 교체 가능) |
| 배포 | PM2 + Nginx (자체 서버) |

---

## 3. 사이트 메뉴 구조

```
메인 홈 (/)
│
├── 기관소개
│   ├── 인사말
│   ├── 연혁
│   ├── 현황 (기관현황 / 아동현황 / 직원현황)
│   ├── 시설안내
│   ├── 오시는 길
│   └── 남산원 역사사진
│
├── 사업소개
│   ├── 행정지원
│   │   ├── 후원금품현황
│   │   └── 영양소식
│   ├── 자립지원
│   └── 아동지원
│       ├── 교육지원팀 (교육부 / 도서부)
│       └── 보육지원팀 (보건소식)
│
├── 남산 이야기
│   ├── 아동 소식 (아동생활 + 학교생활 통합)
│   └── 아동 사진첩 (프로그램 사진 갤러리)
│
├── 후원/자원봉사
│   ├── 후원안내
│   └── 자원봉사 안내
│
├── 게시판
│   ├── 공지사항 (관리자 작성 전용)
│   ├── 채용공고 (관리자 작성 전용)
│   ├── 자유게시판 (비밀번호 방식)
│   ├── 외국인게시판 (foreign)
│   └── 후원·봉사 갤러리
│
└── 사회복지법인 남산원
    └── 법인게시판 (관리자 작성 전용)
```

---

## 4. 프로젝트 디렉토리 구조

```
namsan_home/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # 메인 홈
│   │   ├── about/
│   │   │   ├── greeting/page.tsx       # 인사말
│   │   │   ├── history/page.tsx        # 연혁
│   │   │   ├── status/page.tsx         # 현황
│   │   │   ├── facility/page.tsx       # 시설안내
│   │   │   ├── directions/page.tsx     # 오시는 길
│   │   │   └── photos/page.tsx         # 역사사진
│   │   ├── business/
│   │   │   ├── admin-support/
│   │   │   │   ├── donation/page.tsx   # 후원금품현황
│   │   │   │   └── nutrition/page.tsx  # 영양소식
│   │   │   ├── independence/page.tsx   # 자립지원
│   │   │   └── child-support/
│   │   │       ├── education/page.tsx  # 교육지원팀
│   │   │       └── care/page.tsx       # 보육지원팀
│   │   ├── story/
│   │   │   ├── news/page.tsx           # 아동 소식
│   │   │   └── album/page.tsx          # 아동 사진첩
│   │   ├── support/
│   │   │   ├── donation/page.tsx       # 후원안내
│   │   │   └── volunteer/page.tsx      # 자원봉사 안내
│   │   ├── board/
│   │   │   ├── [category]/
│   │   │   │   ├── page.tsx            # 게시판 목록
│   │   │   │   ├── [id]/page.tsx       # 게시글 상세
│   │   │   │   └── write/page.tsx      # 글쓰기
│   │   │   └── gallery/page.tsx        # 후원·봉사 갤러리
│   │   └── corporation/
│   │       └── board/page.tsx          # 법인게시판
│   ├── admin/
│   │   ├── page.tsx                    # 관리자 대시보드
│   │   ├── posts/page.tsx              # 게시글 관리
│   │   ├── slider/page.tsx             # 슬라이더 이미지 관리
│   │   └── donation/page.tsx           # 후원금품현황 관리
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── posts/route.ts
│       ├── posts/[id]/route.ts
│       └── upload/route.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── home/
│   │   ├── ImageSlider.tsx
│   │   ├── QuickMenu.tsx
│   │   └── RecentPosts.tsx
│   └── board/
│       ├── PostList.tsx
│       ├── PostDetail.tsx
│       └── PostForm.tsx
├── prisma/
│   └── schema.prisma
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
└── public/
    └── images/
        ├── slider-001.jpeg
        ├── slider-002.jpeg
        ├── slider-003.jpeg
        ├── slider-004.jpeg
        ├── slider-005.jpeg
        ├── slider-006.jpeg
        └── slider-007.jpeg
```

---

## 5. 데이터베이스 스키마

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 관리자 계정
model Admin {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt 해시
  createdAt DateTime @default(now())
}

// 게시판 통합 테이블
model Post {
  id        Int      @id @default(autoincrement())
  category  String   // notice | job | free | foreign | gallery | corporation
  title     String
  content   String   @db.LongText
  author    String
  password  String?  // 자유게시판·외국인게시판 비밀번호 (bcrypt)
  isAdmin   Boolean  @default(false)
  views     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     File[]
}

// 첨부파일 / 갤러리 이미지
model File {
  id        Int    @id @default(autoincrement())
  postId    Int
  post      Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  url       String
  filename  String
}

// 후원금품현황
model DonationRecord {
  id        Int      @id @default(autoincrement())
  year      Int
  month     Int
  content   String   @db.Text
  createdAt DateTime @default(now())
}

// 메인 슬라이더 이미지
model SliderImage {
  id     Int     @id @default(autoincrement())
  url    String
  alt    String
  order  Int
  active Boolean @default(true)
}
```

**category 값 기준:**

| category | 게시판 | 작성 권한 |
|---|---|---|
| `notice` | 공지사항 | 관리자 전용 |
| `job` | 채용공고 | 관리자 전용 |
| `free` | 자유게시판 | 비밀번호 방식 |
| `foreign` | 외국인게시판 (다국어 지원, 영어 등 외국어로 소통) | 비밀번호 방식 |
| `gallery` | 후원·봉사 갤러리 | 관리자 전용 |
| `corporation` | 법인게시판 | 관리자 전용 |

---

## 6. UI/UX 디자인 가이드

### 컬러 시스템 (따뜻한 톤)

| 용도 | 색상 | HEX |
|---|---|---|
| Primary | 따뜻한 오렌지 | `#E8863A` |
| Secondary | 밝은 노랑 | `#F5C842` |
| Accent | 자연 초록 | `#6BAE75` |
| Background | 크림 화이트 | `#FFF8F0` |
| Text | 따뜻한 다크브라운 | `#3D2B1F` |

### 메인 페이지 레이아웃

```
┌─────────────────────────────────────────┐
│  [로고]  기관소개 사업소개 남산이야기 후원 게시판  │  ← 고정 헤더
├─────────────────────────────────────────┤
│                                         │
│         풀스크린 이미지 슬라이더           │  ← 7장 자동 전환 (5초 간격)
│         (좌/우 화살표 + 인디케이터)        │
│                                         │
├─────────────────────────────────────────┤
│   공지사항 최신글   │ 아동소식   │ 후원안내  │  ← 3단 미리보기
├─────────────────────────────────────────┤
│             기관 소개 배너               │
├─────────────────────────────────────────┤
│  주소 | 전화 02-752-9836 | 카카오맵      │  ← 푸터
└─────────────────────────────────────────┘
```

### 슬라이더 이미지 배분 계획

| 파일명 | 스타일 | 용도 |
|---|---|---|
| slider-001.jpeg | 3D 렌더링 (석양) | 슬라이드 1 |
| slider-002.jpeg | 3D 렌더링 (아이들 뛰어노는 운동장) | 슬라이드 2 |
| slider-003.jpeg | 3D 렌더링 (봄 분위기) | 슬라이드 3 |
| slider-004.jpeg | 3D 렌더링 (여름 덩굴) | 슬라이드 4 |
| slider-005.jpeg | 수채화 일러스트 (꽃밭) | 슬라이드 5 |
| slider-006.jpeg | 수채화 일러스트 (피크닉) | 슬라이드 6 |
| slider-007.jpeg | 수채화 일러스트 (알록달록) | 슬라이드 7 |

---

## 7. 관리자 페이지 (`/admin`)

- **인증:** NextAuth.js Credentials Provider, 세션 기반
- **대시보드:** 최근 게시글 목록, 미확인 글 수 요약
- **게시판 관리:** 카테고리별 글 목록 / 작성 / 수정 / 삭제
- **슬라이더 관리:** 이미지 순서 드래그 변경, 활성화/비활성화 토글
- **후원금품현황 관리:** 연/월별 데이터 입력 및 수정

---

## 8. 기관 정보

- **기관명:** 사회복지법인 남산원
- **주소:** 서울시 중구 소파로 2길 31 (우) 04628
- **전화:** 02-752-9836
- **팩스:** 02-755-9836
- **홈페이지:** www.namsanwon.or.kr

---

## 9. 비기능 요구사항

- **반응형:** 모바일 / 태블릿 / 데스크탑 전 구간 대응 (Tailwind breakpoints)
- **SEO:** Next.js Metadata API 활용, 각 페이지 title/description 설정
- **접근성:** 이미지 alt 텍스트 필수, 키보드 네비게이션 지원
- **보안:** 비밀번호 bcrypt 해싱, SQL Injection 방지(Prisma ORM), XSS 방지(React 기본)
- **성능:** Next.js Image 컴포넌트로 이미지 최적화, 슬라이더 lazy loading
