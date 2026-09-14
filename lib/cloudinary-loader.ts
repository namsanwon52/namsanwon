// next/image 전역 로더. Vercel Image Optimization(/_next/image)을 거치지 않고
// Cloudinary의 f_auto,q_auto 변환 URL을 바로 쓴다 (이중 변환·Vercel 이미지 한도 소모 방지).
import { cldImage } from './cloudinary-url'

export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('https://res.cloudinary.com/')) return cldImage(src, width)
  // 로컬 정적 파일 등은 원본 그대로 (w는 next/image 로더 규약상 너비 반영 확인용)
  return src.startsWith('/') ? `${src}?w=${width}` : src
}
