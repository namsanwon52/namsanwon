import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put } from '../lib/storage';
import { optimizeImage, sniffFormat, IMAGE_MAX_WIDTH } from '../lib/image-optimize';

const prisma = new PrismaClient();

// 대상 게시판 코드: 첫 번째 인자로 지정 (기본 com3)
const CODE = process.argv[2] || 'com3';
// 크롤 원본 위치. 워크트리처럼 public/crawled 가 없는 체크아웃은 CRAWLED_DIR 로 지정한다.
const CRAWLED_ROOT = process.env.CRAWLED_DIR || path.join(__dirname, '../public/crawled');
const IMAGE_DIR = path.join(CRAWLED_ROOT, `bbs_${CODE}`);
const MAX_WIDTH = Number(process.env.IMAGE_MAX_WIDTH) || IMAGE_MAX_WIDTH;
const QUALITY = Number(process.env.IMAGE_QUALITY) || undefined;
const CONCURRENCY = 6; // 동시 업로드 수

/** 로컬 크롤 누락분을 받아오는 구 사이트 원본 위치 */
const ORIGIN_BASE = 'http://namsanwon.or.kr/admin/data/bbs';

/** 확장자를 뺀 기준 이름 (png→jpg 리사이즈 대비 중복 판정용) */
function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

/** content HTML에서 모든 이미지 파일명 추출 (등장 순서 유지, base 기준 중복 제거) */
function extractAllImages(content: string, code: string): string[] {
  const found: string[] = [];
  for (const m of content.matchAll(/viewImg\('([^']+)'\)/g)) found.push(m[1]);
  if (found.length === 0) {
    // 폴백: img src의 M(썸네일) 접두사 제거
    const re = new RegExp(`src='[^']*/bbs/${code}/M?([^']+)'`, 'g');
    for (const m of content.matchAll(re)) found.push(m[1]);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of found) {
    const b = baseName(f);
    if (seen.has(b)) continue;
    seen.add(b);
    out.push(f);
  }
  return out;
}

/**
 * 이미지 원본을 확보한다. 로컬 크롤본 우선이되, **유효한 이미지인지 확인**한다.
 * 크롤 당시 에러 페이지가 `.jpg` 이름으로 저장된 파일이 섞여 있어서
 * (매직바이트가 `<scr...`) 로컬을 그대로 믿으면 깨진 파일을 올리게 된다.
 * 그런 경우와 로컬에 아예 없는 경우 모두 구 사이트에서 받아온다.
 */
async function loadSource(filename: string): Promise<Buffer | null> {
  const filePath = path.join(IMAGE_DIR, filename);
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    if (buf.length > 0 && sniffFormat(buf) !== 'unknown') return buf;
  }
  try {
    const res = await fetch(`${ORIGIN_BASE}/${CODE}/${encodeURI(filename)}`);
    if (!res.ok) return null;
    const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()));
    if (buf.length === 0 || sniffFormat(buf) === 'unknown') return null;
    return buf;
  } catch {
    return null;
  }
}

type Stats = { uploaded: number; missing: number; error: number };

/** 한 게시물의 모든 이미지를 업로드. 이미 연결된 파일(base 기준)은 건너뜀 */
async function uploadPost(
  post: { id: number; content: string },
  existingBases: Set<string>,
  stats: Stats
): Promise<boolean> {
  const filenames = extractAllImages(post.content, CODE);
  if (filenames.length === 0) return false; // no-image 게시물

  let changed = false;
  for (const filename of filenames) {
    if (existingBases.has(baseName(filename))) continue; // 이미 업로드됨

    try {
      const buffer = await loadSource(filename);
      if (!buffer) {
        stats.missing++;
        continue;
      }
      // 확장자 무관하게 WebP로 재인코딩 (실패 시 원본 통과)
      const { data, contentType, filename: outName } = await optimizeImage(buffer, filename, {
        maxWidth: MAX_WIDTH,
        quality: QUALITY,
      });
      const key = `gallery/${CODE}/${post.id}-${outName}`;

      const blob = await put(key, data, { contentType });

      await prisma.file.create({
        data: { postId: post.id, url: blob.url, filename: outName },
      });
      existingBases.add(baseName(filename));
      stats.uploaded++;
      changed = true;
    } catch (e) {
      stats.error++;
      console.error(`  ❌ [${post.id}] ${filename}:`, e instanceof Error ? e.message : e);
    }
  }
  return changed;
}

async function main() {
  console.log(`🖼️  [${CODE}] 갤러리 썸네일 업로드 시작...\n`);

  for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[k]) {
      console.error(`❌ ${k} 환경변수가 없습니다.`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(IMAGE_DIR)) {
    console.warn(`⚠️  로컬 이미지 디렉터리 없음: ${IMAGE_DIR} — 구 서버에서만 받아옵니다.`);
  }

  // 테스트용 limit (예: `npx tsx ... liv1 5` → 5개만)
  const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  // 이미지 참조가 있는 해당 코드 게시물 (기존 File은 base 기준 중복 제거로 스킵)
  const posts = await prisma.post.findMany({
    where: {
      code: CODE,
      OR: [{ content: { contains: 'viewImg(' } }, { content: { contains: '<img' } }],
    },
    select: { id: true, content: true, files: { select: { filename: true } } },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`대상 게시물: ${posts.length}개\n`);

  const stats: Stats = { uploaded: 0, missing: 0, error: 0 };

  // 동시성 제한 배치 처리
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((p) => {
        const bases = new Set(p.files.map((f) => baseName(f.filename)));
        return uploadPost(p, bases, stats);
      })
    );

    const done = Math.min(i + CONCURRENCY, posts.length);
    if (done % 60 === 0 || done === posts.length) {
      console.log(
        `진행: ${done}/${posts.length} | 업로드 ${stats.uploaded}, 파일없음 ${stats.missing}, 에러 ${stats.error}`
      );
    }
  }

  console.log('\n✨ 완료!');
  console.log(`  ✅ 업로드: ${stats.uploaded}개`);
  console.log(`  ⚠️  로컬 파일 없음: ${stats.missing}개`);
  console.log(`  ❌ 에러: ${stats.error}개`);

  const totalFiles = await prisma.file.count();
  console.log(`\n📊 File 테이블 총 ${totalFiles}개`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
