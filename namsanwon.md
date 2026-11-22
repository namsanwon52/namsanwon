# 남산원 홈페이지 운영·개발 매뉴얼

사회복지법인 아동복지시설 남산원 홈페이지(신규 사이트)의 사용법, 관리자 기능, 개발 환경, 배포(GitHub · Vercel), 저장소(Cloudinary), DB(Neon Postgres) 설정과 장애 대응을 정리한 문서입니다.

> 작성 기준일: 2026-11-20
> 이 문서에는 비밀번호·API 키 같은 **비밀값을 적지 않습니다.** 값은 각 서비스 콘솔과 로컬 `.env`에서 확인하세요.

---

## 목차

1. [시스템 한눈에 보기](#1-시스템-한눈에-보기)
2. [사이트 구성(메뉴·게시판)](#2-사이트-구성메뉴게시판)
3. [관리자 매뉴얼](#3-관리자-매뉴얼)
4. [회원 기능](#4-회원-기능)
5. [로컬 개발 환경](#5-로컬-개발-환경)
6. [환경변수](#6-환경변수)
7. [형상관리(GitHub)](#7-형상관리github)
8. [배포(Vercel)](#8-배포vercel)
9. [DB(Neon Postgres)](#9-dbneon-postgres)
10. [이미지·파일 저장소(Cloudinary)](#10-이미지파일-저장소cloudinary)
11. [구 사이트 데이터 이관](#11-구-사이트-데이터-이관)
12. [장애 대응(자주 겪은 문제)](#12-장애-대응자주-겪은-문제)
13. [폴더 구조](#13-폴더-구조)

---

## 1. 시스템 한눈에 보기

| 구분 | 사용 기술 / 서비스 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack), React 19, TypeScript | |
| 스타일 | `app/(public)/namsanwon-theme.css` (공개 사이트), Tailwind 4 (관리자 화면) | |
| DB | Neon Postgres(Vercel Storage 연동, 2026-11-22 Prisma Postgres에서 이전) + Prisma ORM 5 | `prisma/schema.prisma` |
| 인증 | 관리자: NextAuth(이메일+비밀번호) / 회원: 자체 쿠키 세션 | |
| 파일 저장소 | Cloudinary (이미지·첨부파일) | 이전: Vercel Blob(용량 초과로 이전) |
| 에디터 | Tiptap | 관리자 글쓰기·페이지 편집 |
| 메일 | Nodemailer(SMTP) | 아이디/비밀번호 찾기 인증번호 |
| 형상관리 | GitHub `namsanwon52/namsanwon` (main 브랜치) | |
| 호스팅 | Vercel (main 푸시 시 자동 배포) | 운영 주소: https://namsanwon.vercel.app |

```
[브라우저] ──▶ [Vercel: Next.js] ──▶ [Neon Postgres (풀링 연결)]
     │                │
     │                └──▶ [Cloudinary API: 서명 발급, PDF 서명 다운로드]
     └──(이미지 직접 업로드/표시)──▶ [Cloudinary CDN]
```

---

## 2. 사이트 구성(메뉴·게시판)

상단 메뉴는 `components/namsanwon/menu.ts`, 게시판·중간 메뉴(탭)는 `lib/board.ts`의 `BOARD_META` / `BOARD_SECTIONS`가 기준입니다.

| 대분류 | 메뉴 | 주소 | 게시판 코드 / 비고 |
|---|---|---|---|
| **남산원** | 인사말 · 연혁 · 현황 · 시설안내 · 오시는 길 | `/about/...` | 관리자 "페이지 관리"·"연혁 관리"·"시설안내 관리"에서 편집 |
| | 남산원 역사사진 | `/about/photos` | `com6` (갤러리형) |
| **사업소개** | 행정팀 | `/board/bus1` | 하위 탭: 행정팀 소식(bus1), 후원·금품현황(cus1), 위생·영양(bus2), 안전관리(bus3), 보건(cus21), 상담(bus7) |
| | 자립팀 | `/board/eus1` | |
| | 교육팀 | `/board/dus1` | 하위 탭: 교육부(dus1), 도서부(dus2) |
| **후원/자원봉사** | 후원신청 안내 · 자원봉사신청 안내 | `/support/donation`, `/support/volunteer` | 관리자 "페이지 관리"에서 편집 |
| **아동생활** | 아동생활 · 학교생활 | `/board/liv1`, `/board/dus3` | |
| **커뮤니티** | 공지사항 | `/board/nt1` | 하위 탭: 공지(nt1), 예산(nt2), 결산(nt3), 법인(nt4), 채용(nt5) |
| | 갤러리 | `/board/com3` | 갤러리형 |
| | 소식지 | `/board/com5` | **로그인한 회원/관리자만 열람** (`loginRequired`) |
| | 자유게시판 | `/board/com1` | 회원 글쓰기 가능, 비밀글(비밀번호) 지원 |

메뉴에 없는 게시판: `liv2`(영아방), `schedule`(자원봉사 소식, 탭에서 제외), `cus2`, `cus11` 등은 데이터는 남아 있고 관리자 "게시글 관리 → 기타"에서 볼 수 있습니다.

### 게시판 규칙
- `adminOnly: true` 게시판은 관리자만 글쓰기 가능. 자유게시판(com1)만 회원 글쓰기 허용.
- `loginRequired: true`(현재 소식지)는 목록·상세·첨부 다운로드 모두 로그인 필요. 다른 게시판도 `lib/board.ts`에서 이 값만 켜면 같은 방식으로 잠깁니다.
- 갤러리형(`type: 'gallery'`) 목록 썸네일: 첫 이미지 첨부 → 없으면 PDF 첫 페이지.
- 상세 페이지: 본문 아래(같은 영역)에 첨부 이미지가 왼쪽 정렬로 표시되고, 문서 첨부(PDF·HWP 등)는 그 아래 "첨부파일" 목록으로 표시됩니다.

### 중간 메뉴(탭)·배너 추가 방법
- 탭: `lib/board.ts`의 `BOARD_SECTIONS`에 항목 추가. 게시판이 아닌 페이지는 `href`를 지정.
- 대분류 배너 이미지: `public/namsanwon/banner-{namsanwon|business|support|children|community|default}.*`  
  어떤 페이지가 어떤 배너를 쓰는지는 `components/namsanwon/PageBanner.tsx`가 주소로 판단합니다.

---

## 3. 관리자 매뉴얼

- 접속: `https://namsanwon.vercel.app/admin` (로그인 화면 `/admin/login`)
- 계정: `Admin` 테이블의 이메일/비밀번호. 초기 계정은 `prisma/seed.ts`로 만들어지므로 **운영에서는 반드시 비밀번호를 바꿔 두세요.**

| 메뉴 | 하는 일 |
|---|---|
| 대시보드 | 최근 게시글 등 요약 |
| 페이지 관리 | 인사말·현황·오시는 길·후원/자원봉사 안내 등 소개 페이지를 블럭 단위로 편집(텍스트·이미지) |
| 게시판 이미지 관리 | 게시판 목록 상단 서브 배너 이미지 1장 지정 |
| 게시글 관리 | 대분류 → 팀 → 세부 게시판 순으로 골라 글 작성·수정·삭제, 첨부파일 업로드 |
| 연혁 관리 | 연혁 항목(연·월·일·내용) 등록 |
| 시설안내 관리 | 층별·호실별 시설 정보와 사진 |
| 슬라이더 관리 | 메인 롤링 이미지 등록·순서·제목/설명 |
| 사용자 관리 | 회원 목록 조회·검색·상세 |
| 후원금품현황 | 연·월별 후원금품 내역 등록 |

### 글쓰기·첨부 업로드 규칙 (`lib/upload-client.ts`)
| 대상 | 업로드 방식 |
|---|---|
| 게시글 첨부 이미지·에디터 이미지 | 브라우저에서 가로 1600px, WebP(화질 78%)로 줄여서 업로드 |
| **메인 롤링 이미지(슬라이더)** | **원본 그대로** 업로드 (줄이지 않음) |
| PDF | Cloudinary *이미지 리소스*로 업로드 → 첫 페이지 썸네일 자동 생성 |
| HWP·XLSX·ZIP 등 문서 | 원본 그대로 (raw 리소스) |

- 업로드는 서버가 서명만 발급하고 브라우저가 Cloudinary로 직접 올립니다(Vercel 요청 크기 4.5MB 제한 회피).
- Cloudinary 무료 계정은 파일 1개 **10MB 이하**만 업로드됩니다.

### 메인 롤링 이미지 권장 규격
- 효과(어둡게·확대·잘림) 없이 **올린 이미지 그대로** 화면 폭에 맞춰 표시되고, 높이는 이미지 비율을 따릅니다.
- 권장: 가로 2400px 이상, JPG/WebP(PNG는 용량이 큼). 모든 롤링 이미지를 **같은 비율**로 만들면 넘어갈 때 높이가 흔들리지 않습니다.

---

## 4. 회원 기능

| 기능 | 주소 |
|---|---|
| 회원가입 / 로그인 | `/member/join`, `/member/login` |
| 아이디·비밀번호 찾기(메일 인증번호) | `/member/find-account` — SMTP 설정 필요 |
| 마이페이지 / 비밀번호 변경 | `/member/mypage`, `/member/change-password` |

- 회원 세션은 `member_session` 쿠키(HMAC 서명, `NEXTAUTH_SECRET` 사용, 30일).
- 자유게시판 비밀글: 작성 시 비밀번호(bcrypt 저장). 비밀글 본문·댓글·첨부는 비밀번호 확인 후(또는 관리자) 열람.

---

## 5. 로컬 개발 환경

### 준비물
- Node.js 22 (현재 v22.15.0에서 확인), npm
- Git, (선택) GitHub Desktop / VS Code

### 처음 받기
```bash
git clone https://github.com/namsanwon52/namsanwon.git
cd namsanwon
npm install          # postinstall 로 prisma generate 자동 실행
```
프로젝트 루트에 `.env` 파일을 만들고 [6. 환경변수](#6-환경변수)를 채웁니다. (`.env`는 `.gitignore`에 있어 GitHub에 올라가지 않습니다.)

### 실행
```bash
npm run dev          # http://localhost:3000
```

> ⚠️ **개발 서버는 한 프로젝트에 하나만** 띄우세요. 이미 `next dev`가 돌고 있는데 또 실행하면, 새 프로세스가 종료되면서 `.next/dev`의 경로 정보 파일을 지워 **기존 서버가 메인 외 모든 페이지 404**가 됩니다. → [12장](#12-장애-대응자주-겪은-문제) 참고.
>
> ⚠️ 로컬 `.env`는 **운영과 같은 DB**를 가리킵니다. 로컬에서 글을 쓰거나 지우면 운영 사이트에 바로 반영됩니다.

### 자주 쓰는 명령
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 운영 빌드 / 실행 |
| `npm run type-check` | 타입 검사 |
| `npm run lint` | ESLint |
| `npm test` | Jest 테스트 |
| `npm run db:studio` | Prisma Studio(DB 브라우저) |
| `npm run db:migrate` / `npm run db:deploy` | 마이그레이션 생성 / 적용 |

---

## 6. 환경변수

로컬은 `.env`, 운영은 Vercel → Project → Settings → Environment Variables에 같은 이름으로 넣습니다.

| 이름 | 필수 | 용도 | 값 얻는 곳 |
|---|---|---|---|
| `DATABASE_URL` | ✅ | 앱·스크립트용 **풀링 연결** | Vercel 변수 `NAMSANWONDB_DATABASE_URL`(호스트에 `-pooler`) 값 끝에 `&pgbouncer=true` |
| `DIRECT_URL` | ✅ | 마이그레이션·Studio용 **직접 연결** | Vercel 변수 `NAMSANWONDB_DATABASE_URL_UNPOOLED`(호스트에 `-pooler` 없음) |
| `NEXTAUTH_SECRET` | ✅ | 관리자 로그인 + 회원 세션 서명 | 임의의 긴 랜덤 문자열 (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | 권장 | NextAuth 기준 주소 (없으면 경고) | 운영: `https://namsanwon.vercel.app` (도메인 연결 시 그 주소) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary 계정 이름 | Cloudinary Console → Dashboard |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API 키 | 〃 → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API 시크릿 | 〃 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | 회원 찾기 사용 시 | 인증 메일 발송 | 메일 서비스(SMTP) 설정 |
| `MAIL_FROM` | 선택 | 보내는 사람 표시 | 없으면 `SMTP_USER` |
| `BLOB_READ_WRITE_TOKEN` | 선택 | 옛 Vercel Blob 정리 스크립트용 | 현재 앱에서는 미사용 |
| `IMAGE_MAX_WIDTH`, `IMAGE_QUALITY` | 선택 | 이관 스크립트의 이미지 재인코딩 설정 | |

- 비밀값은 Vercel에서 **Secret** 타입으로 저장하면 다시 볼 수 없습니다. 바꿀 때는 새 값 전체를 붙여 넣으세요.
- `TZ`는 Vercel 예약 변수라 설정할 수 없습니다. 날짜 표시는 코드에서 `timeZone: 'Asia/Seoul'`로 고정되어 있습니다.

---

## 7. 형상관리(GitHub)

- 저장소: https://github.com/namsanwon52/namsanwon
- 기본 브랜치: `main` → **푸시하면 Vercel이 자동으로 운영 배포**합니다.

### 기본 작업 흐름
```bash
git pull origin main            # 최신 받기
# ... 수정 ...
git status                      # 바뀐 파일 확인
git add <파일>                   # 필요한 파일만 담기
git commit -m "변경 내용 요약"
git push origin main            # → Vercel 자동 배포
```

### 권장 사항
- 큰 변경은 브랜치를 만들어 푸시하면 Vercel이 **Preview 배포**(별도 주소)를 만들어 줍니다. 확인 후 main에 합치세요.
  ```bash
  git checkout -b feature/작업이름
  git push -u origin feature/작업이름
  ```
- 커밋하면 안 되는 것: `.env`, `node_modules/`, `.next/`, 테스트용 임시 스크립트(`_t.ts` 등), 이관 작업 JSON.
- 커밋 전 `npm run type-check`로 타입 오류를 확인하세요. 빌드가 실패하면 Vercel 배포도 실패합니다.

### 저장소 접근 권한
- GitHub → 저장소 → Settings → Collaborators 에서 작업자 초대.
- Vercel과 연결된 GitHub 계정이 저장소 접근 권한을 가져야 자동 배포가 동작합니다.

---

## 8. 배포(Vercel)

### 최초 설정(새로 연결할 때)
1. https://vercel.com 로그인 → **Add New → Project** → GitHub 저장소 `namsanwon52/namsanwon` Import
2. Framework: **Next.js** (자동 인식)
3. Build Command: 기본값 그대로 (`npm run build` = `prisma generate && next build`)
4. Environment Variables: [6장](#6-환경변수) 항목을 **Production / Preview** 모두에 등록
5. Deploy

### 평소 배포
- `main`에 푸시 → 자동 빌드·배포 (보통 1~3분)
- Vercel → Deployments에서 상태·로그 확인. 실패 시 Build Logs에서 오류 확인.

### 환경변수를 바꿨을 때
- 이미 떠 있는 배포에는 반영되지 않습니다. **Deployments → 최신 배포 `⋯` → Redeploy** 필요.

### 도메인 연결(namsanwon.or.kr 등)
1. Vercel → Project → Settings → Domains → 도메인 추가
2. 도메인 업체 DNS에 Vercel이 안내하는 레코드(A 또는 CNAME) 등록
3. 연결 후 `NEXTAUTH_URL`을 새 주소로 바꾸고 Redeploy

### 롤백
- Deployments에서 이전 정상 배포의 `⋯` → **Promote to Production** (즉시 이전 버전으로 복구)

### (참고) 자체 서버 배포 파일
- `deploy.sh`, `ecosystem.config.js`(PM2), `nginx.conf`는 Vercel 이전 자체 서버 배포용입니다. 현재 운영은 Vercel만 사용합니다.

---

## 9. DB(Neon Postgres)

> 2026-11-22 Prisma Postgres 무료 플랜 월 사용량(20만 operations) 초과로 DB 접속이 막혀 전 페이지 500이 났고, 데이터 전체를 Neon으로 옮겼습니다. 원인은 11-21 새벽 크롤러가 게시글 상세 1.5만 건을 훑은 것입니다. 이후 `robots.txt`, 봇 조회수 제외, 조회 캐시(아래)를 적용했습니다.

- 스키마: `prisma/schema.prisma`
  주요 테이블: `Post`(게시글, `code`로 게시판 구분), `File`(첨부), `Comment`, `Member`, `Admin`, `SliderImage`, `ContentBlock`·`PageContent`(소개 페이지), `HistoryEntry`(연혁), `FacilityFloor`·`FacilityRoom`(시설), `DonationRecord`(후원금품), `PasswordResetCode`
- 앱 연결: `lib/prisma.ts` (클라이언트 하나를 재사용)

### 연결 방식 (중요)
| 연결 | 호스트 | 쓰는 곳 |
|---|---|---|
| 풀링(PgBouncer) | `...-pooler....neon.tech` + `pgbouncer=true` | 앱(Vercel), 로컬 개발, 이관 스크립트 → `DATABASE_URL` |
| 직접 | `....neon.tech` (`-pooler` 없음) | `prisma migrate`, Prisma Studio → `DIRECT_URL` |

직접 연결은 동시 연결 수 한도가 작아 서버리스에서 금방 고갈됩니다. (Prisma Postgres 시절) 2026-10 운영 장애(전 페이지 500, `too many connections`)가 이 때문이었고, 풀링 연결로 바꿔 해결했습니다.

### 스키마 변경
```bash
# 1) schema.prisma 수정 후 마이그레이션 생성(로컬)
npm run db:migrate -- --name 변경이름
# 2) 운영 DB 적용
npm run db:deploy
```
- 로컬과 운영이 같은 DB이므로 `db:migrate`도 운영 DB에 적용됩니다. **신중히** 실행하세요.
- 과거 일부 변경(`PageContent`)은 `prisma db push`로 반영되어 마이그레이션 기록에 없습니다. 마이그레이션 이력 리셋(`migrate reset`)은 **절대 실행하지 마세요**(데이터 전체 삭제).

### 조회 캐시 (`lib/cache.ts`)
- 공개 화면의 DB 조회 결과는 Vercel Data Cache에 최대 1시간 저장되고, 관리자·회원이 API로 데이터를 바꾸면 해당 태그(`posts`, `slider`, `content-blocks`, `history`, `facility`, `donation`)가 즉시 무효화됩니다.
- 공개 레이아웃이 회원 쿠키를 읽어 페이지 단위 캐시(`export const revalidate`)는 동작하지 않으므로, 새 조회를 추가할 때는 `cachedQuery()`로 감싸고, 데이터를 바꾸는 API에는 `invalidateCache()`를 넣으세요.
- 게시판 목록의 조회수는 최대 1시간 늦게 반영될 수 있습니다(조회수 자체는 사람 방문마다 바로 저장).

### 게시글 번호(id)
- 구 사이트 글은 구 사이트 글번호(idx)를 그대로 id로 씁니다.
- 이관 스크립트로 번호를 직접 넣은 뒤에는 시퀀스를 최대값으로 맞춥니다(스크립트가 자동 처리). 수동으로 넣었다면:
  ```sql
  SELECT setval('"Post_id_seq"', (SELECT MAX(id) FROM "Post"));
  ```

---

## 10. 이미지·파일 저장소(Cloudinary)

### 계정 설정
1. https://cloudinary.com 가입(무료 플랜: 월 25 크레딧, 저장 1GB = 1 크레딧)
2. Console → Dashboard에서 **Cloud name**, Settings → API Keys에서 **API Key / API Secret** 확인
3. 위 3개 값을 `.env`와 Vercel 환경변수에 등록
4. 업로드 프리셋은 필요 없습니다(서버 서명 방식).

### 저장 폴더 규칙
| 폴더 | 내용 |
|---|---|
| `editor/` | 에디터·슬라이더 이미지 |
| `attachments/<시각>/` | 관리자 글쓰기 첨부(PDF·문서) |
| `gallery/<code>/` | 구 사이트에서 옮긴 공지·갤러리·아동·학교 게시판 첨부 |
| `teamfiles/<code>/` | 구 사이트에서 옮긴 사업소개 팀 게시판·역사사진·소식지 첨부 |

- DB(`File.url`)에는 **변환 파라미터 없는 원본 URL만** 저장합니다. 화면 표시용 크기·화질 조정(`f_auto,q_auto,c_limit,w_N`)은 `lib/cloudinary-url.ts`의 `cldImage()`가 붙입니다.
- 너비는 640/960/1280/1600 버킷만 사용(변환 크레딧 절약).

### PDF 관련 (중요)
- Cloudinary 무료 계정은 보안 설정상 **PDF·ZIP 원본 주소 배달이 막혀 있습니다**(401).
- 그래서 첨부 다운로드는 `/api/files/<File id>`를 거칩니다. 서버가 열람 권한을 확인한 뒤 **API 서명 다운로드 URL**로 넘겨 줍니다(1시간 유효).
- Cloudinary Console → Settings → Security → "Allow delivery of PDF and ZIP files"를 켜면 원본 주소로도 받을 수 있지만, 현재 코드는 켜지 않아도 동작합니다.
- PDF 첫 페이지 썸네일은 PDF를 이미지 리소스로 올렸을 때만 생성됩니다(예전에 raw로 올린 PDF는 다운로드만 가능).

### 사용량 확인
- Console → Dashboard에서 크레딧·저장 용량 확인. 한도 초과 시 업로드·표시가 멈출 수 있습니다.

---

## 11. 구 사이트 데이터 이관

구 사이트(namsanwon.or.kr)의 새 글을 신규 사이트로 옮길 때 사용합니다.

### 공개 게시판 새 글 가져오기 (공지·갤러리·아동·학교·사업소개 팀)
```bash
# 1) 구 사이트에서 글번호 39925 이후 수집 → JSON 저장 (DB 변경 없음)
npx tsx prisma/crawl-live-boards.ts 39925 C:/temp/crawl.json
# 2) 반영 내용 미리 보기 (dry-run)
npx tsx prisma/import-live-crawl.ts C:/temp/crawl.json
# 3) 실제 반영 (첨부도 Cloudinary로 업로드)
npx tsx prisma/import-live-crawl.ts C:/temp/crawl.json --apply
```
- 이미 있는 글(같은 번호·같은 게시판, 또는 제목+본문이 같은 2026년 글)은 자동으로 건너뜁니다.
- 신규 사이트 글과 번호가 겹치면 새 번호로 넣고, 끝나면 번호 시퀀스를 맞춥니다.
- 마지막 이관: 2026-11-10 (글번호 39924까지).
- 소식지(com5)·자유게시판 비밀글은 구 사이트 로그인/비밀번호가 필요해 이 스크립트로는 수집되지 않습니다(별도 처리).

### 그 밖의 이관 스크립트 (`prisma/`)
| 스크립트 | 용도 |
|---|---|
| `restore-from-dump.ts <code> [--apply]` | DB 덤프(`docs/sql/260513_namsan.sql`)로 게시판 복구(제목·본문·비밀글·비밀번호) |
| `import-team-files.ts [code]` | 덤프 기준 첨부파일을 구 서버에서 받아 연결 |
| `import-team-boards.ts` | 덤프에서 팀 게시판 글 가져오기 |
| `parse-and-import.ts` | 최초 전체 임포트(**기존 글 전체 삭제 후** 다시 넣음 — 운영에서 실행 금지) |

---

## 12. 장애 대응(자주 겪은 문제)

| 증상 | 원인 | 해결 |
|---|---|---|
| 운영 전 페이지 500, 로그에 `too many connections` | DB 직접 연결 한도 초과 | `DATABASE_URL`을 풀링 주소(`pooled.db.prisma.io` + `pgbouncer=true`)로. Vercel 환경변수 수정 후 Redeploy |
| 로컬에서 메인만 열리고 나머지 전부 404 | 같은 폴더에서 `next dev`가 두 번 실행되어 `.next/dev` 손상 | 개발 서버 프로세스 모두 종료 → `.next/dev` 폴더 삭제 → `npm run dev` 한 번만 |
| PDF 다운로드 안 됨(401) | Cloudinary PDF 배달 차단 | 링크가 `/api/files/<id>`를 쓰는지 확인 (10장 참고) |
| 작성일이 하루 전으로 보임 | 서버(UTC)에서 날짜를 그림 | 날짜 표시에 `timeZone: 'Asia/Seoul'` 지정 |
| 이미지가 흐림 | 업로드 시 1600px WebP로 축소 | 슬라이더는 원본 업로드. 게시글 이미지 화질을 올리려면 `lib/upload-client.ts`의 `MAX_WIDTH`/`WEBP_QUALITY` 조정 |
| 소식지가 로그인 없이 보임 | 관리자 로그인 상태(관리자는 열람 허용) | 시크릿 창에서 확인 |
| 업로드 실패 "로그인이 만료" | 관리자 세션 만료 | 관리자 다시 로그인 |
| Vercel 빌드 실패 | 타입 오류, 환경변수 누락 | Build Logs 확인, 로컬 `npm run type-check` / `npm run build` |
| 운영 전 페이지 500, 로그에 `Can't reach database server` | DB 서비스 월 사용량 한도 초과로 접속 차단 (2026-11 Prisma Postgres) | DB 콘솔의 Usage 확인. 플랜 업그레이드 또는 다른 DB로 이전 (9장 참고) |
| 스크립트로 DB를 고쳤는데 화면에 반영 안 됨 | 공개 화면 조회 캐시(최대 1시간) | 1시간 기다리거나 Vercel 프로젝트 설정의 Data Cache 비우기(Purge). 관리자 화면에서 고친 내용은 즉시 반영됨 (`lib/cache.ts`) |

---

## 13. 폴더 구조

```
app/
  (public)/            공개 사이트 (메인, about, board, support, member ...)
    namsanwon-theme.css   공개 사이트 공통 스타일(색상 토큰, 배너, 게시판 등)
    board/[category]/     게시판 목록·상세·글쓰기
  admin/               관리자 화면
  api/                 API (posts, files, upload/sign, slider, member, ...)
components/
  namsanwon/           헤더·푸터·배너·중간 메뉴·메인 슬라이더 등
  board/               게시판 공통(비밀글, 댓글, PDF 미리보기 ...)
lib/
  board.ts             게시판 정의·메뉴 구조·관리자 그룹
  boardAccess.ts       로그인 필요 게시판 권한 체크
  storage.ts           Cloudinary 업로드/삭제(서버)
  upload-client.ts     관리자 업로드(브라우저)
  cloudinary-url.ts    이미지 표시용 변환 URL
  file-url.ts          첨부 썸네일·다운로드 링크(PDF 처리)
  content.ts           구 사이트 본문 이미지 경로 변환
prisma/
  schema.prisma        DB 스키마
  migrations/          마이그레이션 기록
  *.ts                 시드·이관 스크립트
public/
  namsanwon/           배너·아이콘 등 정적 이미지
  logo-namsanwon.png   헤더 로고
docs/sql/              구 사이트 DB 덤프·크롤링 원본 (참고용)
```
