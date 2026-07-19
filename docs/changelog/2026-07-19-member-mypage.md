# 패치노트 — 2026-07-19

## 🔧 Changed

**레거시 이관 회원 로그인 (`/member/login`)**
- 레거시 이관 회원(총 405명 중 401명, `passwd IS NULL`)이 로그인 시도 시 그냥 에러 문구만 보고 끝나던 것을, 안내 팝업 → 비밀번호 재설정 플로우로 자연스럽게 이어지도록 개선
  - `app/api/member/login/route.ts`: `passwd` 미설정 계정 로그인 시도 시 에러 응답에 `code: 'PASSWORD_NOT_SET'` 추가
  - `components/member/LoginForm.tsx`: 해당 코드 수신 시 인라인 에러 대신 안내 팝업 노출("비밀번호를 한 번만 새로 설정해 주시면 됩니다" 등 회원 대상 안내 문구), "비밀번호 변경하기" 클릭 시 `/member/find-account?id=아이디&reason=password-not-set`로 이동
  - `components/member/FindAccountPanels.tsx`: 쿼리파라미터로 넘어온 아이디를 비밀번호 재설정 폼에 자동입력 + 상단에 안내 배너 노출
  - 비밀번호 재설정 완료 후에는 자동로그인 시키지 않고 `/member/login`으로 보내 새 비밀번호로 직접 다시 로그인하도록 함 (기존 3단계 재설정 API는 그대로 재사용, 백엔드 변경 없음)
  - 별도 `isLegacy` 같은 플래그 컬럼은 추가하지 않음 — `passwd IS NULL` 자체가 레거시 여부를 정확히 나타내는 기존 신호라 이걸로 충분
  - 실제 계정(`ilsu3221`, `passwd`를 직접 NULL로 초기화 후 테스트)으로 로그인 → 팝업 → 재설정 → 재로그인까지 end-to-end 확인 완료

**헤더 회원 메뉴 (`components/namsanwon/SiteHeader.tsx`)**
- 로그인 시 "OOO님"이 그냥 텍스트로만 표시되던 것을 클릭 가능한 드롭다운으로 변경 — 클릭하면 **개인정보변경**, **비밀번호 변경** 두 메뉴 노출
- 로그아웃 버튼은 기존처럼 드롭다운 밖 별도 버튼으로 유지(사용자 확정 사항)
- 기존 상단 네비게이션 서브메뉴(`navItem`/`subMenu`/`isOpen`) 열고닫기 패턴 그대로 재사용, 외부클릭/ESC로 닫힘
- `app/(public)/namsanwon-theme.css`에 `.userMenu`/`.userMenuTrigger`/`.userMenuDropdown` 스타일 추가 (PC: 앵커된 팝업, 모바일: `subMenu` 모바일 처리 방식과 동일하게 인라인으로 펼침)
- `components/member/MemberTabs.tsx`: `/member/mypage`, `/member/change-password`에서는 기존 회원가입/로그인/아이디비번찾기 탭 대신 개인정보변경/비밀번호변경 탭으로 전환되도록 분기 추가

## ✨ Added

**개인정보변경 (`/member/mypage`)**
- 로그인 회원이 이름/전화번호/이메일/주소/SMS·이메일 수신동의를 직접 수정 가능
- `app/(public)/member/mypage/page.tsx`(서버 컴포넌트, 비로그인 시 `/member/login`으로 리다이렉트) + `components/member/MyInfoForm.tsx`(가입 폼 정보입력 단계와 동일한 필드/다음 우편번호 검색 재사용) + `app/api/member/me/route.ts`(`PATCH`)
- 아이디는 읽기전용, 비밀번호는 이 폼에서 다루지 않음(별도 페이지로 분리)
- 이름 변경 시 헤더에 바로 반영되도록 저장 성공 시 `member_session` 쿠키를 새 이름으로 재발급

**비밀번호 변경 (`/member/change-password`)**
- 로그인 상태에서 현재 비밀번호 확인 후 새 비밀번호로 교체
- `app/(public)/member/change-password/page.tsx`(동일 로그인 가드) + `components/member/ChangePasswordForm.tsx` + `app/api/member/change-password/route.ts`(`POST`)
- 새 비밀번호 규칙은 가입/비밀번호재설정과 동일(`^[A-Za-z0-9]{4,12}$`), `lib/hash.ts`의 `verifyPassword`/`hashPassword` 그대로 재사용
- 성공해도 로그아웃시키지 않고 세션 유지
- "새 비밀번호"/"새 비밀번호 확인" 입력칸을 처음엔 2단 그리드(`joinFieldGrid`)로 나란히 배치했다가, 세로로 한 줄씩 쌓이도록 수정

**로그인 필요 페이지 가드 (신규 패턴)**
- 이 프로젝트에 로그인 필요 페이지를 막는 패턴이 전혀 없었음(`middleware.ts` 없음) — `getMemberSession()` 확인 후 없으면 `redirect('/member/login')` 하는 서버 컴포넌트 가드를 이번에 최초 도입, 마이페이지/비밀번호변경 두 페이지에 적용

**Footer가 짧은 페이지에서 바닥에 붙지 않던 문제 (`app/(public)/namsanwon-theme.css`)**
- 비밀번호변경 페이지처럼 내용이 짧은 페이지에서 footer가 화면 중간, 내용 바로 아래에 붙어버리던 문제 발견
- `body`를 `display: flex; flex-direction: column; min-height: 100vh`로, `#main`을 `flex: 1 0 auto`로 설정하는 sticky-footer 레이아웃 적용 — 내용이 짧으면 본문이 남은 공간을 채워 footer가 화면 맨 아래로 밀려나고, 내용이 길면 기존처럼 내용 바로 뒤에 자연스럽게 붙음
- 헤더(`.globalNav`)는 `position: sticky`라 이 flex 레이아웃과 문제없이 호환됨

## ⚠️ 알아두실 점 / 다음에 할 일

- **다음에 할 일**: 회원 세션(`member_session`)이 현재 활동 여부와 무관하게 30일 고정 만료라, 15분간 활동 없으면 자동 로그아웃되는 idle timeout 도입 필요. 서버 쪽 sliding expiry(요청마다 쿠키를 짧은 만료로 재발급) 방식이 유력하며, 이를 위해 `middleware.ts` 신규 도입 + 세션 payload 자체에 만료시각 포함시키는 작업이 필요함 (현재는 쿠키의 브라우저 측 maxAge에만 의존)
- 회원 탈퇴 기능은 이번에 다루지 않음
- Member 모델의 관리자 전용/미사용 필드(`photo`, `nick`, `birthday` 등)는 개인정보변경 폼에 노출하지 않음 — 가입 API가 다루는 필드만 수정 가능
- 개인정보변경/비밀번호변경 기능은 구현만 완료된 상태, 타입체크·실제 브라우저 테스트는 사용자가 직접 진행 예정
