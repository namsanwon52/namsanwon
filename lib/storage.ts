/**
 * 오브젝트 스토리지 어댑터 (Cloudinary).
 *
 * Vercel Blob 무료 한도(1GB) 초과로 스토어가 정지되면서 이전했다. Cloudinary 무료는
 * 카드 등록 없이 월 25 크레딧(저장·변환·대역폭 공용)이고, 저장 1GB = 1 크레딧이다.
 * 우리는 업로드 전에 이미 WebP로 인코딩하므로(`lib/image-optimize.ts`)
 * **배달 시 변환 파라미터를 붙이지 않는다** — 그래야 변환 크레딧이 발생하지 않는다.
 *
 * ⚠️ Cloudinary 콘솔의 "Default delivery optimization"이 켜져 있으면 원본 배달에도
 *    f_auto/q_auto가 적용돼 변환 크레딧을 먹는다. 이미 최적화된 자산이라 이득도 없으니
 *    Settings → Optimization 에서 꺼두는 편이 맞다.
 *
 * 앱/스크립트는 `@vercel/blob` 대신 이 모듈만 쓴다.
 *
 * 필요한 환경변수:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import { v2 as cloudinary } from 'cloudinary';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 없습니다. Cloudinary 설정을 확인하세요.`);
  return v;
}

let _configured = false;
function configured() {
  if (_configured) return cloudinary;
  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  });
  _configured = true;
  return cloudinary;
}

/** 이미지로 배달할 content type인지 (아니면 raw 리소스로 올린다) */
function isImageType(contentType?: string): boolean {
  return !!contentType && contentType.startsWith('image/');
}

/**
 * Cloudinary public_id 로 쓸 수 없거나 URL을 깨뜨리는 문자를 정리한다.
 * 레거시 크롤링 파일명에 공백·괄호·한글이 섞여 있다.
 */
export function sanitizeKey(key: string): string {
  return key
    .split('/')
    .map((seg) =>
      seg
        .replace(/\s+/g, '_')
        .replace(/[?&#%<>\\+]/g, '') // Cloudinary/URL에서 문제되는 문자 제거
        .replace(/_{2,}/g, '_')
    )
    .join('/');
}

const CLOUDINARY_URL_RE =
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/;
const VERCEL_BLOB_RE = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/(.+)$/;

/**
 * URL에서 스토어 키를 역산한다.
 * 이전 작업 중에는 DB에 옛 Vercel Blob URL이 남아 있으므로 둘 다 인식한다.
 */
export function keyFromUrl(url: string): string | null {
  const cld = url.match(CLOUDINARY_URL_RE);
  if (cld) return decodeURIComponent(cld[1]);
  const vercel = url.match(VERCEL_BLOB_RE);
  if (vercel) return decodeURIComponent(vercel[1]);
  return null;
}

/** 우리가 관리하는 스토리지의 URL인지 (Vercel Blob 잔존분 포함) */
export function isManagedUrl(url: string): boolean {
  return keyFromUrl(url) !== null;
}

/** Cloudinary 리소스 종류 판별 — raw 는 확장자가 public_id 에 포함된다 */
function resourceTypeForKey(key: string): 'image' | 'raw' {
  return /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|svg)$/i.test(key) ? 'image' : 'raw';
}

export type PutResult = { url: string; key: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 일시적 오류(5xx·429·네트워크)인지 — 이런 건 재시도하면 대개 통과한다 */
function isTransient(e: unknown): boolean {
  const code = (e as { http_code?: number })?.http_code;
  if (typeof code === 'number') return code === 429 || code >= 500;
  const name = (e as { name?: string })?.name ?? '';
  return /UnexpectedResponse|FetchError|TimeoutError|ECONNRESET|ETIMEDOUT/i.test(name);
}

/**
 * 업로드. 같은 키면 덮어쓴다.
 *
 * 이미지: public_id 에서 확장자를 뺀다 (Cloudinary가 format 을 따로 관리).
 * 그 외(pdf/hwp 등): resource_type='raw' 로 올리고 public_id 에 확장자를 포함한다.
 */
export async function put(
  key: string,
  data: Buffer,
  opts: { contentType?: string } = {}
): Promise<PutResult> {
  const cld = configured();
  const safeKey = sanitizeKey(key);
  const asImage = isImageType(opts.contentType) || resourceTypeForKey(safeKey) === 'image';
  const resourceType: 'image' | 'raw' = asImage ? 'image' : 'raw';
  const publicId = asImage ? safeKey.replace(/\.[^./]+$/, '') : safeKey;

  const upload = () =>
    new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cld.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          invalidate: true,
          use_filename: false,
          unique_filename: false,
        },
        (err, res) => {
          if (err) return reject(err);
          if (!res) return reject(new Error('Cloudinary 응답이 비었습니다'));
          resolve(res as { secure_url: string });
        }
      );
      stream.end(data);
    });

  // Cloudinary가 간헐적으로 503을 낸다. 일시적 오류만 지수 백오프로 재시도한다.
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await upload();
      return { url: result.secure_url, key: safeKey };
    } catch (e) {
      lastError = e;
      if (!isTransient(e) || attempt === 3) break;
      await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
  throw lastError;
}

/** 키 또는 URL로 삭제. Cloudinary는 한 번에 최대 100개. */
export async function del(target: string | string[]): Promise<void> {
  const cld = configured();
  const items = Array.isArray(target) ? target : [target];
  const keys = items.map((t) => keyFromUrl(t) ?? t).filter(Boolean);
  if (keys.length === 0) return;

  // resource_type 별로 나눠 호출해야 한다
  const groups: Record<'image' | 'raw', string[]> = { image: [], raw: [] };
  for (const k of keys) {
    const rt = resourceTypeForKey(k);
    groups[rt].push(rt === 'image' ? k.replace(/\.[^./]+$/, '') : k);
  }

  for (const rt of ['image', 'raw'] as const) {
    const ids = groups[rt];
    for (let i = 0; i < ids.length; i += 100) {
      await cld.api.delete_resources(ids.slice(i, i + 100), {
        resource_type: rt,
        invalidate: true,
      });
    }
  }
}

export type ListedObject = { key: string; url: string; size: number };

/** 계정의 오브젝트를 모두 순회한다 (image + raw). */
export async function listAll(prefix?: string): Promise<ListedObject[]> {
  const cld = configured();
  const out: ListedObject[] = [];
  for (const rt of ['image', 'raw'] as const) {
    let cursor: string | undefined;
    do {
      const res = await cld.api.resources({
        type: 'upload',
        resource_type: rt,
        prefix,
        max_results: 500,
        next_cursor: cursor,
      });
      for (const r of res.resources ?? []) {
        const key = rt === 'image' && r.format ? `${r.public_id}.${r.format}` : r.public_id;
        out.push({ key, url: r.secure_url, size: r.bytes ?? 0 });
      }
      cursor = res.next_cursor;
    } while (cursor);
  }
  return out;
}

/** 현재 크레딧/사용량 (무료 한도 모니터링용) */
export async function usage(): Promise<Record<string, unknown>> {
  return (await configured().api.usage()) as unknown as Record<string, unknown>;
}
