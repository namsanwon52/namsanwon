/**
 * 남산원소개 소개 페이지(PageContent) 초기 콘텐츠 시드.
 * 기존 정적 페이지 내용을 HTML로 옮겨 upsert 한다. (이미 있으면 건너뜀)
 * 실행: npx tsx prisma/seed-pages.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: 'greeting',
    title: '인사말',
    content: `<h2>원장 인사말</h2>
<p>남산원 홈페이지를 방문해 주신 여러분을 진심으로 환영합니다.</p>
<p>저희 남산원은 1953년 설립 이후 서울 남산 자락에서 아동들의 건강한 성장과 자립을 위해 헌신해왔습니다. 아이들 한 명 한 명이 밝고 행복하게 성장할 수 있도록 최선을 다하겠습니다.</p>
<p style="text-align:right">사회복지법인 남산원 원장 드림</p>`,
  },
  {
    slug: 'history',
    title: '연혁',
    content: `<h2>남산원 연혁</h2>
<table>
<tbody>
<tr><th>1953</th><td>남산원 설립</td></tr>
<tr><th>1960</th><td>보육시설 인가</td></tr>
<tr><th>1970</th><td>아동복지시설 등록</td></tr>
<tr><th>1980</th><td>사회복지법인 인가</td></tr>
<tr><th>1990</th><td>자립지원 프로그램 시작</td></tr>
<tr><th>2000</th><td>홈페이지 개설, 교육지원팀 신설</td></tr>
<tr><th>2010</th><td>보육지원팀 신설, 시설 증축</td></tr>
<tr><th>2020</th><td>남산원 리모델링 시작</td></tr>
<tr><th>2024</th><td>신관 완공</td></tr>
</tbody>
</table>`,
  },
  {
    slug: 'status',
    title: '현황',
    content: `<h2>기관 현황</h2>
<table><tbody>
<tr><th>기관명</th><td>사회복지법인 남산원</td></tr>
<tr><th>설립연도</th><td>1953년</td></tr>
<tr><th>주소</th><td>서울시 중구 소파로 2길 31</td></tr>
<tr><th>정원</th><td>아동 00명</td></tr>
</tbody></table>
<h2>아동 현황</h2>
<table><tbody>
<tr><th>총 아동 수</th><td>현재 인원 입력 필요</td></tr>
<tr><th>남아</th><td>-</td></tr>
<tr><th>여아</th><td>-</td></tr>
</tbody></table>
<h2>직원 현황</h2>
<table><tbody>
<tr><th>총 직원 수</th><td>현재 인원 입력 필요</td></tr>
<tr><th>사회복지사</th><td>-</td></tr>
<tr><th>보육교사</th><td>-</td></tr>
</tbody></table>`,
  },
  {
    slug: 'facility',
    title: '시설안내',
    content: `<h2>시설 안내</h2>
<p>아이들이 생활하고 배우는 남산원의 공간을 소개합니다.</p>
<ul>
<li><strong>생활실</strong> — 시설 설명을 입력해주세요.</li>
<li><strong>교육실</strong> — 시설 설명을 입력해주세요.</li>
<li><strong>도서실</strong> — 시설 설명을 입력해주세요.</li>
<li><strong>식당</strong> — 시설 설명을 입력해주세요.</li>
<li><strong>운동장</strong> — 시설 설명을 입력해주세요.</li>
<li><strong>상담실</strong> — 시설 설명을 입력해주세요.</li>
</ul>`,
  },
  {
    slug: 'directions',
    title: '오시는 길',
    content: `<h2>오시는 길</h2>
<table><tbody>
<tr><th>주소</th><td>서울시 중구 소파로 2길 31 (우) 04628</td></tr>
<tr><th>전화</th><td>02-752-9836</td></tr>
<tr><th>팩스</th><td>02-755-9836</td></tr>
<tr><th>대중교통</th><td>교통 정보를 입력해주세요.</td></tr>
</tbody></table>`,
  },
];

async function main() {
  for (const p of PAGES) {
    await prisma.pageContent.upsert({
      where: { slug: p.slug },
      update: {}, // 이미 있으면 내용 보존 (관리자 편집 유지)
      create: p,
    });
    console.log(`✓ ${p.slug} (${p.title})`);
  }
  const n = await prisma.pageContent.count();
  console.log(`\nPageContent 총 ${n}개`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
