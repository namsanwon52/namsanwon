import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
