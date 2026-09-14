import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary가 f_auto,q_auto로 변환·캐시하므로 Vercel 이미지 최적화를 거치지 않는다
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
    // srcset 너비를 lib/cloudinary-url.ts의 WIDTHS 버킷과 맞춰 변환 조합이 늘지 않게 한다
    deviceSizes: [640, 960, 1280, 1600],
    imageSizes: [320],
    localPatterns: [
      { pathname: '/images/**' },
      { pathname: '/uploads/**' },
    ],
    remotePatterns: [
      // 이전 저장소(Vercel Blob) — 마이그레이션 잔존 URL 대비
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Cloudinary 배달 도메인
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
