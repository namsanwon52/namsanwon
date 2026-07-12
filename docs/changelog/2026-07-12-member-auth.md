# 패치노트 — 2026-07-12

## ✨ Added

**회원가입 (`/member/join`)**
- 3단계 위자드: 약관동의 → 정보입력 → 가입완료
- 아이디 중복확인, 우편번호 검색(카카오/다음 우편번호 서비스 연동, 무료)
- `Member` 테이블 기반 실제 DB 저장, 비밀번호는 bcrypt 해싱

**로그인 (`/member/login`)**
- 아이디/비밀번호 로그인
- 서명된 쿠키 기반 세션 (관리자 NextAuth와 완전 분리된 별도 인증 체계)
- 헤더에 로그인 상태 반영 — 로그인 시 "OOO님 / 로그아웃", 비로그인 시 "로그인 / 회원가입"

**아이디/비밀번호 찾기 (`/member/find-account`)**
- 이름+이메일로 아이디 찾기
- 아이디+이름+이메일 확인 후 임시비밀번호 발급 (화면에 즉시 표시 — 이메일 발송 인프라 없어 임시 조치)

**공통 컴포넌트/인프라**
- `components/member/` — JoinWizard, LoginForm, FindAccountPanels, MemberTabs, MemberPageHead
- `lib/memberSession.ts` — 서명 쿠키 세션 유틸
- `app/api/member/*` — join, login, logout, check-id, find-id, reset-password
- `docs/design-system.md` — 피그마 디자인 토큰(색상/타이포/spacing/radius) 문서화

## 🔧 Changed

- 헤더 "회원가입"/"로그인" 링크: `/admin/login` → `/member/join`, `/member/login`으로 정정
- 관리자페이지는 공개 사이트 어디에서도 링크되지 않음 (별도 URL로만 접근)

## 🗑️ Removed

- 회원가입 자동등록방지코드(캡차) 기능 전체 제거 (UI, API, 유틸, CSS)

## ⚠️ 알아두실 점 / 다음에 할 일

- 약관/개인정보처리방침 문구는 피그마 스크린샷에서 옮긴 초안 — 법무 검토된 최종본으로 교체 필요
- 비밀번호 찾기는 이메일 발송 없이 화면에 임시비밀번호 노출 방식 — 추후 이메일 서비스 연동 시 개선 가능
- 로그인 실패 메시지가 "비밀번호 미설정 계정"과 "아이디/비번 틀림"을 구분해서 안내 (레거시 이관 계정 배려 목적, 다만 아이디 존재 여부가 일부 드러나는 트레이드오프 있음)
- 마이페이지, 회원 탈퇴, 비밀번호 변경 등은 아직 미구현
