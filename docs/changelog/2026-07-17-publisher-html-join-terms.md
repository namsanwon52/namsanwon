# 패치노트 — 2026-07-17

## ✨ Added

**퍼블리셔 HTML 참고 자료 (`docs/design/publisher-html/`)**
- 퍼블리셔가 작업한 정적 사이트(`raymondkim0818/sh_ds`)의 `page/`, `css/`, `js/` 원본 소스를 프로젝트에 커밋해 참고용으로 보관
- 앞으로 페이지 신규 제작/수정 시 이 폴더의 마크업/클래스를 기준으로 구현

## 🔧 Changed

**회원가입 약관동의 (`/member/join`, 1단계)**
- `components/member/JoinWizard.tsx`의 약관동의 단계 마크업을 퍼블리셔 `join.html` 구조(`joinFlow`, `joinSteps`, `joinTermsCard`, `joinTermsGroup`, `joinCheck` 등)로 교체
- 3단계 스텝 인디케이터도 함께 퍼블 디자인으로 교체 (기존 커스텀 `joinStepper` → `joinSteps`)
- 체크박스 아이콘(`icon_check_S*.svg`, `icon_check_M*.svg`) `public/namsanwon/`에 추가
- 기능은 변경 없음: 체크 상태 관리, 전체동의 로직, 두 항목 모두 동의해야 다음 단계로 진행하는 제약 그대로 유지
- 더 이상 쓰이지 않는 기존 스테퍼 CSS(`joinStepper`, `joinStep`, `joinStepNo` 등) 제거

**회원가입 정보입력 (`/member/join`, 2단계)**
- `joinFormCard`, `joinField`, `joinFieldGrid`, `joinInputRow`, `joinRadioLine` 등 퍼블리셔 `join-info.html` 구조로 마크업 교체
- 라디오 아이콘(`icon_radio_M.svg`, `icon_radio_M_active.svg`) `public/namsanwon/`에 추가
- 퍼블 디자인엔 있는 자동등록방지코드(캡차) 필드는 제외 — 2026-07-12에 이미 기능 자체를 제거하기로 한 부분이라 반영하지 않음
- 기능 변경 없음: 아이디 중복확인, 비밀번호 확인, SMS/이메일 수신동의, 다음 우편번호 검색 전부 기존 로직 그대로
- 더 이상 쓰이지 않는 기존 CSS(`joinFieldGroup`, `joinFieldHint`, `joinFieldRow`, `joinRadioRow`, `joinAddressRow`) 제거, `formField`/`btnGhostDark`는 게시판 등 다른 곳에서도 써서 유지
- 루트 CSS 변수 `--form-control-height`, `--form-text-y-adjust` 추가 (퍼블 `root.css`엔 있었는데 우리 테마에 누락되어 있었음)

**회원가입 완료 (`/member/join`, 3단계)**
- `joinCompleteCard`, `joinCompleteIcon`, `joinConfirmButton` 등 퍼블리셔 `join-complete.html` 구조로 마크업 교체
- 아이콘 자리(퍼블 원본은 빈 장식 박스)에 이모지(🫶) 대신 헤더/푸터와 동일한 `/logo-namsanwon.svg` 로고 배치
- 확인 버튼은 기존과 동일하게 `/`(홈)로 이동 (퍼블 목업은 `login.html`로 되어 있지만 기능 변경 없이 기존 동작 유지)
- 휴대폰 필수 입력 처리: 2단계 휴대폰 필드에 `required` 추가 (서버는 이미 필수 검증 중이었는데 화면엔 표시가 없었음)
- 더 이상 쓰이지 않는 기존 CSS(`joinCard`, `joinCardTitle`, `joinSection`, `termsBox`, `termsCheckRow`, `joinAllCheckRow`, `joinDoneWrap`, `joinDoneIcon`, `joinDoneActions`) 제거, `btnPrimaryBlock`은 아이디/비밀번호 찾기 화면에서도 써서 유지

이로써 회원가입 3단계(약관동의/정보입력/가입완료) 전체가 퍼블리셔 디자인으로 교체 완료.
