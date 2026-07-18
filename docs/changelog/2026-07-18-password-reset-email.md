# 패치노트 — 2026-07-18

## 🔧 Changed

**비밀번호 재설정 (`/member/find-account`)**
- 아이디+이름+이메일 일치 시 임시비밀번호를 화면에 즉시 노출하던 방식 제거 → 이메일 인증코드 확인 후 본인이 직접 새 비밀번호를 입력하는 3단계 방식으로 교체
  1. 아이디/이름/이메일 입력 → 회원 테이블에 등록된 이메일로 6자리 인증코드 발송
  2. 인증코드 입력/확인 (5분 만료, 5회 시도 제한, 60초 재전송 쿨다운)
  3. 새 비밀번호 입력 → 재설정 완료
- `components/member/FindAccountPanels.tsx`의 "비밀번호 재설정" 카드를 위저드로 교체하면서, 마크업/CSS를 퍼블리셔 목업(`docs/design/publisher-html/page/find-account*.html`) 클래스(`findAccountCard`, `findAccountCodeGroup` 등)로 통일 — "아이디 찾기" 카드도 같은 스타일로 맞춤
- `app/api/member/reset-password/route.ts`(임시비번 즉시발급) 삭제, `request` / `verify` / `confirm` 3개 API 라우트로 분리 (`app/api/member/reset-password/*`)
- 단계 간 상태는 서버 세션 없이 `lib/resetToken.ts`(HMAC 서명 토큰, `lib/memberSession.ts`와 동일 패턴)로 전달

## ✨ Added

**이메일 발송 인프라**
- 프로젝트에 이메일 발송 수단이 전혀 없어서 신규 구축: `nodemailer` 기반 `lib/mail.ts` 추가 (개인 SMTP 계정 사용: 남산원 계정으로 보내는것으로함)
- `PasswordResetCode` 테이블 신설 (`prisma/schema.prisma`) — 인증코드는 평문 저장하지 않고 sha256 해시로 저장

## ⚠️ 알아두실 점 / 다음에 할 일

- `npm install`, `.env`에 SMTP 값(Gmail 앱 비밀번호) 입력, DB 반영, 실제 이메일 수신/재설정까지 전부 완료 및 동작 확인함
- DB 반영은 `npx prisma migrate dev`가 아니라 `npx prisma db push`로 함 — 라이브 DB가 `Comment`/`PageContent`/`Post` 테이블에서 기존 마이그레이션 히스토리와 어긋나는 드리프트가 있어서 `migrate dev`가 전체 스키마 리셋(데이터 삭제)을 요구했음(오늘 작업과 무관한 기존 상태). `db push`는 히스토리를 안 보고 현재 DB와 스키마만 비교해서 `password_reset_code` 테이블만 안전하게 추가함. 이 드리프트 자체는 아직 해소 안 된 상태라 다음에 `migrate dev`를 쓰려면 별도로 정리 필요
- 세션이 stateless라 재설정 완료 시 다른 기기 로그인 세션을 서버에서 강제 로그아웃시키는 기능은 없음 — 범위 밖으로 남겨둠
