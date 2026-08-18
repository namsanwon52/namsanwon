/**
 * 지정한 prefix의 Blob 객체를 삭제한다. **DB의 File 레코드는 남겨둔다.**
 *
 * 용도: Blob 스토어가 용량 초과로 정지(suspended)되면 업로드가 막혀 재인코딩 자체를 못 한다.
 * 이때 로컬 원본(`public/crawled`)으로 100% 복구 가능한 게시판을 먼저 지워 한도 아래로 내리고,
 * 정지가 풀린 뒤 `reencode-blob.ts` 로 WebP 재업로드한다.
 *
 * File 레코드를 남기는 이유: `reencode-blob.ts` 가 File.url 에서 스토어 경로를 역산해
 * 로컬 원본을 찾으므로, 레코드가 있으면 Blob이 없어도 그대로 재업로드가 된다.
 *
 * 기본은 드라이런이며 실제 삭제는 --apply 를 붙여야 한다.
 *
 * 실행:
 *   npx tsx scripts/delete-blob-prefix.ts --prefix=gallery/com3
 *   npx tsx scripts/delete-blob-prefix.ts --apply --prefix=gallery/com3 --prefix=gallery/liv2
 */
import 'dotenv/config'; // BLOB_READ_WRITE_TOKEN 로드 (Prisma를 import하지 않는 스크립트라 직접 필요)
import { list, del } from '@vercel/blob';

const APPLY = process.argv.includes('--apply');
const PREFIXES = process.argv
  .filter((a) => a.startsWith('--prefix='))
  .map((a) => a.slice('--prefix='.length))
  .filter(Boolean);

const BATCH = 100;
/** 배치 사이 간격(ms). Blob API는 초당 요청수 제한이 있어 페이싱이 필요하다 */
const PACE_MS = 400;
const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 레이트 리밋(429)이면 retryAfter만큼 기다렸다 재시도한다 */
async function delWithRetry(urls: string[], attempt = 0): Promise<void> {
  try {
    await del(urls);
  } catch (e) {
    const retryAfter = (e as { retryAfter?: number })?.retryAfter;
    if (retryAfter && attempt < 5) {
      const wait = (retryAfter + 2) * 1000;
      console.log(`  ⏳ 레이트 리밋 — ${Math.round(wait / 1000)}초 대기 후 재시도 (${attempt + 1}/5)`);
      await sleep(wait);
      return delWithRetry(urls, attempt + 1);
    }
    throw e;
  }
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경변수가 없습니다.');
    process.exit(1);
  }
  if (PREFIXES.length === 0) {
    console.error('❌ --prefix= 를 하나 이상 지정하세요.');
    process.exit(1);
  }

  console.log(`${APPLY ? '🗑️  삭제 모드' : '🔍 드라이런'} | prefix: ${PREFIXES.join(', ')}\n`);

  // 스토어 전체를 한 번 순회 (prefix 옵션 대신 직접 필터 — 다중 prefix 지원)
  const all: { pathname: string; url: string; size: number }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ limit: 1000, cursor });
    for (const b of res.blobs) all.push({ pathname: b.pathname, url: b.url, size: b.size });
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);

  const total = all.reduce((s, b) => s + b.size, 0);
  const targets = all.filter((b) => PREFIXES.some((p) => b.pathname.startsWith(p)));
  const targetBytes = targets.reduce((s, b) => s + b.size, 0);

  console.log(`전체: ${all.length}개 / ${mb(total)}MB`);
  console.log(`삭제 대상: ${targets.length}개 / ${mb(targetBytes)}MB`);
  console.log(`삭제 후 예상: ${all.length - targets.length}개 / ${mb(total - targetBytes)}MB\n`);

  // prefix별 내역
  for (const p of PREFIXES) {
    const sel = targets.filter((b) => b.pathname.startsWith(p));
    console.log(`  ${p.padEnd(20)} ${String(sel.length).padStart(6)}개  ${mb(sel.reduce((s, b) => s + b.size, 0)).padStart(8)}MB`);
  }

  if (!APPLY) {
    console.log('\n※ 드라이런입니다. 실제 삭제는 --apply 를 붙여 실행하세요.');
    return;
  }

  console.log('\n삭제 시작...');
  let done = 0;
  let freed = 0;
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    await delWithRetry(batch.map((b) => b.url));
    done += batch.length;
    freed += batch.reduce((s, b) => s + b.size, 0);
    if (done % 1000 < BATCH || done === targets.length) {
      console.log(`  ${done}/${targets.length} 삭제 | 확보 ${mb(freed)}MB`);
    }
    if (i + BATCH < targets.length) await sleep(PACE_MS);
  }

  console.log(`\n✨ 완료: ${done}개 삭제, ${mb(freed)}MB 확보`);
  console.log(`   DB File 레코드는 그대로 두었습니다 (reencode-blob.ts 로 재업로드).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
