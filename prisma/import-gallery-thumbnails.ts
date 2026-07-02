import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import sharp from 'sharp';

const prisma = new PrismaClient();

// 대상 게시판 코드: 첫 번째 인자로 지정 (기본 com3)
const CODE = process.argv[2] || 'com3';
const IMAGE_DIR = path.join(__dirname, `../public/crawled/bbs_${CODE}`);
const MAX_WIDTH = 1600; // 이보다 크면 리사이즈
const SIZE_THRESHOLD = 300 * 1024; // 300KB 초과 시 재인코딩
const JPEG_QUALITY = 82;
const CONCURRENCY = 6; // 동시 업로드 수

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

/** 큰 이미지는 리사이즈/재인코딩, 작은 이미지는 원본 그대로 반환 */
async function processImage(
  buffer: Buffer,
  ext: string
): Promise<{ data: Buffer; contentType: string; resized: boolean }> {
  const isImage = /^(jpe?g|png|bmp|webp)$/i.test(ext);
  if (!isImage) {
    // 이미지가 아니면 그대로 (방어적, 보통 발생 안 함)
    return { data: buffer, contentType: 'application/octet-stream', resized: false };
  }

  try {
    const meta = await sharp(buffer).metadata();
    const tooWide = (meta.width ?? 0) > MAX_WIDTH;
    const tooBig = buffer.length > SIZE_THRESHOLD;

    if (!tooWide && !tooBig) {
      // 작고 폭도 적당하면 원본 유지
      const ct = ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
      return { data: buffer, contentType: ct, resized: false };
    }

    let pipeline = sharp(buffer).rotate(); // EXIF 회전 보정
    if (tooWide) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    const out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { data: out, contentType: 'image/jpeg', resized: true };
  } catch {
    // sharp 실패 시 원본 업로드
    return { data: buffer, contentType: 'application/octet-stream', resized: false };
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

    const filePath = path.join(IMAGE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      stats.missing++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filename).slice(1);
      const { data, contentType, resized } = await processImage(buffer, ext);

      // 리사이즈된 경우 확장자를 jpg로 통일
      const outName = resized ? filename.replace(/\.[^.]+$/, '.jpg') : filename;
      const blobPath = `gallery/${CODE}/${post.id}-${outName}`;

      const blob = await put(blobPath, data, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경변수가 없습니다.');
    process.exit(1);
  }

  if (!fs.existsSync(IMAGE_DIR)) {
    console.error(`❌ 이미지 디렉터리가 없습니다: ${IMAGE_DIR}`);
    process.exit(1);
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
