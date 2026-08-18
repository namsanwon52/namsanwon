import sharp from 'sharp'

/**
 * Blob 저장 용량을 줄이기 위한 공용 이미지 최적화.
 *
 * 원칙:
 *  - 확장자를 믿지 않고 매직 바이트로 포맷을 판별한다 (크롤링 데이터에 `.peg` 같은 깨진 확장자가 섞여 있음).
 *  - 크기 임계값 없이 항상 WebP로 재인코딩한다. JPEG q82 파생물도 WebP로 바꾸면 절반 이하가 된다.
 *  - sharp/libvips가 못 읽는 무압축 BMP는 자체 디코더로 raw 픽셀을 뽑아 넘긴다.
 *  - 이미지가 아니거나 디코딩이 끝까지 실패하면 원본을 그대로 통과시킨다 (문서 첨부 등).
 */

export const IMAGE_MAX_WIDTH = 1600
export const WEBP_QUALITY = 78

export type OptimizeResult = {
  data: Buffer
  contentType: string
  /** 재인코딩된 경우 확장자가 .webp로 교체된 이름 */
  filename: string
  optimized: boolean
}

type Format = 'jpeg' | 'png' | 'gif' | 'bmp' | 'webp' | 'tiff' | 'unknown'

/** 매직 바이트로 실제 포맷 판별 (확장자 무시) */
export function sniffFormat(buf: Buffer): Format {
  if (buf.length < 12) return 'unknown'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.readUInt32BE(0) === 0x89504e47) return 'png'
  if (buf.subarray(0, 3).toString('latin1') === 'GIF') return 'gif'
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'webp'
  const be = buf.readUInt32BE(0)
  if (be === 0x49492a00 || be === 0x4d4d002a) return 'tiff'
  return 'unknown'
}

/**
 * 무압축(BI_RGB) / BI_BITFIELDS 24·32bpp BMP를 RGB raw 버퍼로 디코딩한다.
 * libvips가 BMP 로더 없이 빌드돼 있어 sharp가 바로 못 읽는다.
 */
function decodeBmp(buf: Buffer): { data: Buffer; width: number; height: number } {
  if (buf.length < 54) throw new Error('BMP 헤더가 잘렸습니다')
  const dataOffset = buf.readUInt32LE(10)
  const dibSize = buf.readUInt32LE(14)
  if (dibSize < 40) throw new Error(`지원하지 않는 DIB 헤더 크기: ${dibSize}`)

  const width = buf.readInt32LE(18)
  const rawHeight = buf.readInt32LE(22)
  const height = Math.abs(rawHeight)
  const bpp = buf.readUInt16LE(28)
  const compression = buf.readUInt32LE(30)

  if (compression !== 0 && compression !== 3) throw new Error(`압축 BMP(${compression})는 미지원`)
  if (bpp !== 24 && bpp !== 32) throw new Error(`${bpp}bpp BMP는 미지원`)
  if (width <= 0 || height <= 0) throw new Error('BMP 크기가 잘못됨')

  const bytesPerPixel = bpp / 8
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4
  if (dataOffset + rowSize * height > buf.length) throw new Error('BMP 픽셀 데이터가 잘렸습니다')

  const out = Buffer.allocUnsafe(width * height * 3)
  for (let y = 0; y < height; y++) {
    // 높이가 양수면 bottom-up 저장 → 위아래 뒤집어 읽는다
    const srcRow = rawHeight > 0 ? height - 1 - y : y
    let src = dataOffset + srcRow * rowSize
    let dst = y * width * 3
    for (let x = 0; x < width; x++) {
      out[dst] = buf[src + 2] // B G R → R G B
      out[dst + 1] = buf[src + 1]
      out[dst + 2] = buf[src]
      src += bytesPerPixel
      dst += 3
    }
  }
  return { data: out, width, height }
}

function toWebpName(filename: string): string {
  return /\.[^./]+$/.test(filename) ? filename.replace(/\.[^./]+$/, '.webp') : `${filename}.webp`
}

/** 이미지면 WebP로 재인코딩, 아니면 원본 그대로 반환 */
export async function optimizeImage(
  buffer: Buffer,
  filename: string,
  opts: { maxWidth?: number; quality?: number; fallbackContentType?: string } = {}
): Promise<OptimizeResult> {
  const maxWidth = opts.maxWidth ?? IMAGE_MAX_WIDTH
  const quality = opts.quality ?? WEBP_QUALITY
  const passthrough: OptimizeResult = {
    data: buffer,
    contentType: opts.fallbackContentType ?? 'application/octet-stream',
    filename,
    optimized: false,
  }

  const format = sniffFormat(buffer)
  if (format === 'unknown') return passthrough

  try {
    let input: ReturnType<typeof sharp>
    if (format === 'bmp') {
      const { data, width, height } = decodeBmp(buffer)
      input = sharp(data, { raw: { width, height, channels: 3 } })
    } else {
      // GIF는 애니메이션 프레임을 모두 살려 animated WebP로 내보낸다
      input = sharp(buffer, { failOn: 'none', animated: format === 'gif' })
    }

    const data = await input
      .rotate() // EXIF 회전 반영 (raw 입력에서는 무시됨)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer()

    // 재인코딩이 오히려 커지는 경우(이미 잘 압축된 작은 WebP 등)는 원본 유지
    if (format === 'webp' && data.length >= buffer.length) {
      return { ...passthrough, contentType: 'image/webp' }
    }

    return { data, contentType: 'image/webp', filename: toWebpName(filename), optimized: true }
  } catch {
    return passthrough
  }
}
