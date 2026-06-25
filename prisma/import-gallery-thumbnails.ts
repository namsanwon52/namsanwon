import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import sharp from 'sharp';

const prisma = new PrismaClient();

const IMAGE_DIR = path.join(__dirname, '../public/crawled/bbs_com3');
const MAX_WIDTH = 1600; // 이보다 크면 리사이즈
const SIZE_THRESHOLD = 300 * 1024; // 300KB 초과 시 재인코딩
const JPEG_QUALITY = 82;
const CONCURRENCY = 6; // 동시 업로드 수

/** content HTML에서 첫 번째 이미지 파일명 추출 */
function extractFirstImage(content: string): string | null {
  const m = content.match(/viewImg\('([^']+)'\)/);
  if (m) return m[1];
  // 폴백: img src의 M 접두사 제거
  const s = content.match(/src='[^']*\/bbs\/com3\/M?([^']+)'/);
  return s ? s[1] : null;
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

async function uploadOne(post: { id: number; content: string }): Promise<
  'uploaded' | 'no-image' | 'missing-file' | 'error'
> {
  const filename = extractFirstImage(post.content);
  if (!filename) return 'no-image';

  const filePath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filePath)) return 'missing-file';

  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).slice(1);
    const { data, contentType, resized } = await processImage(buffer, ext);

    // 리사이즈된 경우 확장자를 jpg로 통일
    const outName = resized ? filename.replace(/\.[^.]+$/, '.jpg') : filename;
    const blobPath = `gallery/com3/${post.id}-${outName}`;

    const blob = await put(blobPath, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await prisma.file.create({
      data: { postId: post.id, url: blob.url, filename: outName },
    });

    return 'uploaded';
  } catch (e) {
    console.error(`  ❌ [${post.id}] ${filename}:`, e instanceof Error ? e.message : e);
    return 'error';
  }
}

async function main() {
  console.log('🖼️  갤러리 썸네일 업로드 시작...\n');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경변수가 없습니다.');
    process.exit(1);
  }

  // 테스트용 limit (예: `npx tsx ... 5` → 5개만)
  const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;

  // File이 아직 없는 com3 게시물만
  const posts = await prisma.post.findMany({
    where: { code: 'com3', files: { none: {} } },
    select: { id: true, content: true },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`대상 게시물: ${posts.length}개\n`);

  const stats = { uploaded: 0, 'no-image': 0, 'missing-file': 0, error: 0 };

  // 동시성 제한 배치 처리
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((p) => uploadOne(p)));
    for (const r of results) stats[r]++;

    const done = Math.min(i + CONCURRENCY, posts.length);
    if (done % 60 === 0 || done === posts.length) {
      console.log(
        `진행: ${done}/${posts.length} | 업로드 ${stats.uploaded}, 이미지없음 ${stats['no-image']}, 파일없음 ${stats['missing-file']}, 에러 ${stats.error}`
      );
    }
  }

  console.log('\n✨ 완료!');
  console.log(`  ✅ 업로드: ${stats.uploaded}개`);
  console.log(`  ⏭️  이미지 참조 없음: ${stats['no-image']}개`);
  console.log(`  ⚠️  로컬 파일 없음: ${stats['missing-file']}개`);
  console.log(`  ❌ 에러: ${stats.error}개`);

  const totalFiles = await prisma.file.count();
  console.log(`\n📊 File 테이블 총 ${totalFiles}개`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
