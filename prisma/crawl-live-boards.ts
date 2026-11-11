/**
 * 구 사이트(namsanwon.or.kr) 공개 게시판에서 지정 번호 이후 글을 수집해
 * import-live-crawl.ts 가 읽는 JSON으로 저장한다.
 *
 * - 대상: 로그인 없이 열리는 게시판(공지/갤러리/아동생활/학교생활/사업소개 팀 게시판).
 *   소식지(com5)·자유게시판 비밀글은 로그인/비밀번호가 필요해 여기서 다루지 않는다.
 * - 목록을 1페이지부터 넘기며 idx >= minIdx 인 글을 모으고, 상세 화면을 파싱한다.
 * - DB 중복 판정은 하지 않는다 (import-live-crawl.ts 가 이미 있는 글을 건너뛴다).
 *
 * 실행: npx tsx prisma/crawl-live-boards.ts <minIdx> <out.json> [code,code,...]
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';

const BASE = 'http://namsanwon.or.kr';
const BOARDS: Record<string, string> = {
  nt1: '/05/commu01.php',
  com3: '/05/commu09.php',
  liv1: '/04/baby02.php',
  dus3: '/04/baby03.php',
  bus1: '/02/bus01.php',
  eus1: '/02/eus01.php',
  dus1: '/02/dus01.php',
  cus11: '/02/cus01.php',
};

async function get(path: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(BASE + path, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) return await res.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error('fetch 실패: ' + path);
}

async function listIds(code: string, minIdx: number): Promise<number[]> {
  const php = BOARDS[code];
  const all = new Set<number>();
  for (let page = 1; page < 400; page++) {
    const h = await get(`${php}?ptype=list&page=${page}&code=${code}`);
    const ids = [...new Set([...h.matchAll(/idx=(\d+)[^"']*?code=([a-z0-9]+)/g)].filter((m) => m[2] === code).map((m) => +m[1]))];
    if (!ids.length) break;
    ids.filter((i) => i >= minIdx).forEach((i) => all.add(i));
    // 상단 고정 공지가 섞여 있으므로 페이지 중간값이 기준보다 작아지면 종료
    const sorted = ids.sort((a, b) => a - b);
    if (sorted[Math.floor(sorted.length / 2)] < minIdx) break;
  }
  return [...all].sort((a, b) => a - b);
}

async function extract(idx: number, code: string) {
  const h = await get(`${BOARDS[code]}?ptype=view&idx=${idx}&page=1&code=${code}`);
  if (h.includes('권한이 없습니다')) return { idx, code, err: 'denied' };
  const d = new JSDOM(h).window.document;
  const cell = (label: string) => {
    const s = [...d.querySelectorAll('td strong')].find((x) => x.textContent?.trim() === label);
    return s ? (s.closest('td')?.nextElementSibling as Element | null) : null;
  };
  const titleTd = cell('제목');
  if (!titleTd) return { idx, code, err: 'parse' };
  const title = (titleTd.querySelector('td') || titleTd).textContent?.trim() ?? '';
  const body = titleTd.closest('tr')?.parentElement?.querySelector('td[height="50"]');
  const stored = [...h.matchAll(/viewImg\('([^']+)'\)/g)].map((m) => m[1]);
  const fileTd = cell('파일첨부');
  const files = fileTd
    ? [...fileTd.querySelectorAll('a[href*="down.php"]')].map((a) => ({
        no: +(new URLSearchParams((a.getAttribute('href') ?? '').split('?')[1]).get('no') ?? 0),
        name: a.textContent?.trim() ?? '',
      }))
    : [];
  let content = '';
  let inlineImgs: string[] = [];
  if (body) {
    const inner = body.querySelector('table td') || body;
    const c = inner.cloneNode(true) as Element;
    c.querySelectorAll('a[href^="javascript:viewImg"], #wiz_get_table_width, img[name="wiz_target_resize"]').forEach((e) => e.remove());
    const tables = c.querySelectorAll(':scope > table');
    const textCell = c.querySelector(':scope > table td[valign="top"]');
    const target = textCell && tables.length === 1 && !c.querySelector(':scope > :not(table):not(div:empty)') ? textCell : c;
    target.querySelectorAll('div').forEach((dv) => {
      if (!dv.textContent?.trim() && !dv.querySelector('img,iframe')) dv.remove();
    });
    content = target.innerHTML.replace(/\s+/g, ' ').trim();
    inlineImgs = [...target.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '').filter(Boolean);
  }
  return {
    idx, code, title,
    name: cell('이름')?.textContent?.trim() ?? '',
    email: cell('이메일')?.textContent?.trim() ?? '',
    date: cell('작성일')?.textContent?.trim() ?? '',
    views: +(cell('조회수')?.textContent?.trim() || 0),
    files, stored, inlineImgs, content,
  };
}

async function main() {
  const minIdx = Number(process.argv[2]);
  const out = process.argv[3];
  const codes = process.argv[4] ? process.argv[4].split(',') : Object.keys(BOARDS);
  if (!minIdx || !out) {
    console.error('사용법: npx tsx prisma/crawl-live-boards.ts <minIdx> <out.json> [code,...]');
    process.exit(1);
  }
  const jobs: [number, string][] = [];
  for (const code of codes) {
    const ids = await listIds(code, minIdx);
    console.log(`${code}: ${ids.length}건 (${ids[0] ?? '-'} ~ ${ids[ids.length - 1] ?? '-'})`);
    ids.forEach((i) => jobs.push([i, code]));
  }
  const data: unknown[] = [];
  let k = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (k < jobs.length) {
      const [i, c] = jobs[k++];
      try { data.push(await extract(i, c)); } catch (e) { data.push({ idx: i, code: c, err: String(e) }); }
    }
  }));
  const errs = (data as { err?: string; idx: number }[]).filter((x) => x.err);
  fs.writeFileSync(out, JSON.stringify(data));
  console.log(`\n수집 ${data.length}건, 오류 ${errs.length}건 ${errs.map((e) => e.idx + ':' + e.err).join(' ')} → ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
