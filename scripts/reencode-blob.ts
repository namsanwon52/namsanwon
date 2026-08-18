/**
 * 이미 Vercel Blob에 올라간 이미지를 WebP로 재인코딩해 저장 용량을 줄인다.
 *
 * 동작:
 *  1. File 테이블에서 Blob URL을 가진 레코드를 읽는다.
 *  2. 원본 소스를 확보한다 — gallery/*는 public/crawled/bbs_<code>/ 로컬 원본을 우선 사용하고,
 *     로컬에 없으면(주로 teamfiles/*) 현재 Blob에서 내려받는다.
 *  3. WebP로 재인코딩해 같은 디렉터리에 .webp 로 업로드하고, File.url / File.filename 을 갱신한다.
 *  4. 경로가 바뀐 경우에만 옛 Blob 객체를 삭제한다.
 *
 * 이미 .webp 인 레코드, 이미지가 아닌 첨부(pdf/hwp 등)는 건너뛴다.
 * 기본은 드라이런이며 실제 반영은 --apply 를 붙여야 한다.
 *
 * 실행:
 *   npx tsx scripts/reencode-blob.ts                        # 드라이런(예상 절감량만 계산)
 *   npx tsx scripts/reencode-blob.ts --apply                # 실제 반영
 *   npx tsx scripts/reencode-blob.ts --apply --prefix=gallery/com3 --limit=50
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put, del, list } from '@vercel/blob';
import { optimizeImage, IMAGE_MAX_WIDTH, WEBP_QUALITY } from '../lib/image-optimize';

const prisma = new PrismaClient();

const CONCURRENCY = 6;

const arg = (flag: string) => process.argv.find((a) => a.startsWith(flag))?.slice(flag.length);

/** 크롤링 원본 디렉터리. 워크트리처럼 public/crawled 가 없는 체크아웃에서는 --crawled= 로 지정 */
const CRAWLED_ROOT = arg('--crawled=') ?? path.join(__dirname, '../public/crawled');
const APPLY = process.argv.includes('--apply');
const PREFIX = arg('--prefix=') ?? '';
const LIMIT = Number(arg('--limit=')) || undefined;
const MAX_WIDTH = Number(arg('--max-width=')) || IMAGE_MAX_WIDTH;
const QUALITY = Number(arg('--quality=')) || WEBP_QUALITY;

const BLOB_HOST = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//;

/** Blob URL → 스토어 내 경로 (예: gallery/com3/10010-abc.jpg) */
function blobPath(url: string): string | null {
  const m = url.match(/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** 게시판별 로컬 원본 인덱스: code → (확장자 뺀 파일명 → 실제 경로) */
function buildLocalIndex(): Map<string, Map<string, string>> {
  const index = new Map<string, Map<string, string>>();
  if (!fs.existsSync(CRAWLED_ROOT)) return index;
  for (const dir of fs.readdirSync(CRAWLED_ROOT)) {
    if (!dir.startsWith('bbs_')) continue;
    const byBase = new Map<string, string>();
    for (const name of fs.readdirSync(path.join(CRAWLED_ROOT, dir))) {
      byBase.set(name.replace(/\.[^.]+$/, ''), path.join(CRAWLED_ROOT, dir, name));
    }
    index.set(dir.slice(4), byBase);
  }
  return index;
}

/** gallery/<code>/<postId>-<name> 형태에서 로컬 원본 경로를 찾는다 */
function findLocalOriginal(
  storePath: string,
  index: Map<string, Map<string, string>>
): string | null {
  const m = storePath.match(/^gallery\/([^/]+)\/\d+-(.+)$/);
  if (!m) return null;
  return index.get(m[1])?.get(m[2].replace(/\.[^.]+$/, '')) ?? null;
}

/** 구 사이트 원본 위치. 로컬 크롤 누락분(현재 6건)이 여기 남아 있다 */
const ORIGIN_BASE = 'http://namsanwon.or.kr/admin/data/bbs';

function originUrl(storePath: string): string | null {
  const m = storePath.match(/^gallery\/([^/]+)\/\d+-(.+)$/);
  if (!m) return null;
  return `${ORIGIN_BASE}/${m[1]}/${encodeURI(m[2])}`;
}

type Stats = {
  scanned: number;
  skippedWebp: number;
  skippedNonImage: number;
  fromLocal: number;
  fromBlob: number;
  fromOrigin: number;
  converted: number;
  /** 현재 Blob에 저장된 크기 합계 (절감량 기준) */
  blobBefore: number;
  /** 재인코딩 결과 크기 합계 */
  blobAfter: number;
  /** 읽어들인 소스(로컬 원본 또는 Blob) 크기 합계 — 참고용 */
  sourceBytes: number;
  unknownSize: number;
  noSource: number;
  error: number;
};

/**
 * Blob 스토어 전체를 한 번 순회해 경로별 현재 크기를 모은다.
 * 로컬 원본에서 재인코딩할 때 "현재 Blob 대비" 절감량을 정확히 계산하려면 필요하다.
 */
async function fetchBlobSizes(): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  let cursor: string | undefined;
  do {
    const res = await list({ limit: 1000, cursor });
    for (const b of res.blobs) sizes.set(b.pathname, b.size);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return sizes;
}

async function handleRow(
  row: { id: number; url: string; filename: string },
  index: Map<string, Map<string, string>>,
  blobSizes: Map<string, number>,
  stats: Stats
) {
  const storePath = blobPath(row.url);
  if (!storePath) return;
  stats.scanned++;

  if (/\.webp$/i.test(storePath)) {
    stats.skippedWebp++;
    return;
  }

  // 원본 확보: 로컬 크롤링 원본 우선, 없으면 현재 Blob에서 내려받기
  let source: Buffer | null = null;
  const local = findLocalOriginal(storePath, index);
  if (local) {
    try {
      source = fs.readFileSync(local);
      stats.fromLocal++;
    } catch {
      source = null;
    }
  }
  // 소스 후보를 순서대로 시도: 현재 Blob → 구 사이트 원본
  if (!source) {
    const candidates: { url: string; kind: 'blob' | 'origin' }[] = [{ url: row.url, kind: 'blob' }];
    const origin = originUrl(storePath);
    if (origin) candidates.push({ url: origin, kind: 'origin' });

    const failures: string[] = [];
    for (const c of candidates) {
      try {
        const res = await fetch(c.url);
        if (!res.ok) {
          failures.push(`${c.kind} HTTP ${res.status}`);
          continue;
        }
        const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()));
        if (buf.length === 0) {
          failures.push(`${c.kind} 빈 응답`);
          continue;
        }
        source = buf;
        if (c.kind === 'blob') stats.fromBlob++;
        else stats.fromOrigin++;
        break;
      } catch (e) {
        failures.push(`${c.kind} ${e instanceof Error ? e.message : e}`);
      }
    }
    if (!source) {
      stats.noSource++;
      console.error(`  ⚠️  [${row.id}] 원본 확보 실패 ${storePath} (${failures.join(' / ')})`);
      return;
    }
  }

  const result = await optimizeImage(source, path.basename(storePath), {
    maxWidth: MAX_WIDTH,
    quality: QUALITY,
  });
  if (!result.optimized) {
    // 이미지가 아니거나 디코딩 실패 → 그대로 둔다
    stats.skippedNonImage++;
    return;
  }

  const dir = storePath.slice(0, storePath.lastIndexOf('/') + 1);
  const newPath = dir + result.filename.replace(/\s+/g, '_');

  // 절감량은 "현재 Blob 크기 → 재인코딩 결과" 기준으로 센다.
  // 소스가 로컬 원본이면 source.length 는 Blob에 있는 파생물보다 크므로 그대로 쓰면 절감량이 과대평가된다.
  const currentSize = blobSizes.get(storePath);
  if (currentSize === undefined) stats.unknownSize++;
  stats.blobBefore += currentSize ?? source.length;
  stats.blobAfter += result.data.length;
  stats.sourceBytes += source.length;
  stats.converted++;
  if (!APPLY) return; // 드라이런은 크기 집계까지만

  try {
    const blob = await put(newPath, result.data, {
      access: 'public',
      contentType: result.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await prisma.file.update({
      where: { id: row.id },
      data: { url: blob.url, filename: result.filename },
    });
    // 경로가 실제로 바뀐 경우에만 옛 객체 삭제 (같은 경로면 이미 덮어써졌다)
    if (newPath !== storePath) {
      try {
        await del(row.url);
      } catch (e) {
        console.error(`  ⚠️  옛 Blob 삭제 실패 ${storePath}:`, e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    stats.error++;
    console.error(`  ❌ [${row.id}] ${storePath}:`, e instanceof Error ? e.message : e);
  }
}

async function main() {
  if (APPLY && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경변수가 없습니다.');
    process.exit(1);
  }

  const mode = APPLY ? '🚀 반영 모드' : '🔍 드라이런';
  console.log(
    `${mode} | WebP q${QUALITY}, 최대 폭 ${MAX_WIDTH}px${PREFIX ? ` | prefix: ${PREFIX}` : ''}\n`
  );

  const index = buildLocalIndex();
  const idxDesc = [...index].map(([c, m]) => `${c}(${m.size})`).join(', ');
  console.log(`로컬 원본 인덱스: ${idxDesc || '없음'}`);

  let blobSizes = new Map<string, number>();
  try {
    blobSizes = await fetchBlobSizes();
    const total = [...blobSizes.values()].reduce((s, n) => s + n, 0);
    console.log(
      `현재 Blob: ${blobSizes.size}개 / ${(total / 1024 / 1024).toFixed(1)}MB\n`
    );
  } catch (e) {
    console.warn(
      `⚠️  Blob 목록 조회 실패 — 절감량을 소스 크기 기준으로 추정합니다:`,
      e instanceof Error ? e.message : e,
      '\n'
    );
  }

  const rows = await prisma.file.findMany({
    select: { id: true, url: true, filename: true },
    orderBy: { id: 'asc' },
  });
  const targets = rows
    .filter((r) => BLOB_HOST.test(r.url))
    .filter((r) => !PREFIX || (blobPath(r.url) ?? '').startsWith(PREFIX))
    .slice(0, LIMIT);

  console.log(`대상 레코드: ${targets.length}개\n`);

  const stats: Stats = {
    scanned: 0,
    skippedWebp: 0,
    skippedNonImage: 0,
    fromLocal: 0,
    fromBlob: 0,
    fromOrigin: 0,
    converted: 0,
    blobBefore: 0,
    blobAfter: 0,
    sourceBytes: 0,
    unknownSize: 0,
    noSource: 0,
    error: 0,
  };

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    await Promise.all(
      targets.slice(i, i + CONCURRENCY).map((r) => handleRow(r, index, blobSizes, stats))
    );
    const done = Math.min(i + CONCURRENCY, targets.length);
    if (done % 300 === 0 || done === targets.length) {
      console.log(
        `진행 ${done}/${targets.length} | 변환 ${stats.converted} | ${mb(stats.blobBefore)}MB → ${mb(
          stats.blobAfter
        )}MB | 원본없음 ${stats.noSource} | 에러 ${stats.error}`
      );
    }
  }

  const saved = stats.blobBefore - stats.blobAfter;
  const pct = stats.blobBefore ? ((saved / stats.blobBefore) * 100).toFixed(1) : '0';
  console.log('\n✨ 완료');
  console.log(
    `  검사 ${stats.scanned} | 이미 webp ${stats.skippedWebp} | 이미지 아님·디코딩실패 ${stats.skippedNonImage}`
  );
  console.log(
    `  소스: 로컬 원본 ${stats.fromLocal}, Blob 다운로드 ${stats.fromBlob}, 구서버 ${stats.fromOrigin}, 확보 실패 ${stats.noSource}`
  );
  console.log(
    `  변환 ${stats.converted}개: Blob ${mb(stats.blobBefore)}MB → ${mb(stats.blobAfter)}MB (절감 ${mb(saved)}MB, ${pct}%)`
  );
  console.log(`  (읽어들인 소스 원본 합계 ${mb(stats.sourceBytes)}MB)`);
  if (stats.unknownSize) console.log(`  ⚠️  현재 Blob 크기를 못 찾은 항목 ${stats.unknownSize}개는 소스 크기로 대체 집계`);
  if (stats.error) console.log(`  ❌ 에러 ${stats.error}개`);
  if (!APPLY) console.log('\n※ 드라이런입니다. 실제 반영은 --apply 를 붙여 실행하세요.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
