import type { MetadataRoute } from 'next'

// 크롤러 안내. 2026-11-21 크롤러가 게시글 상세 1.5만 건을 훑어 DB 사용량 한도를 넘긴 일이 있어
// 검색·페이지 파라미터와 API·관리 화면은 수집하지 않도록 하고, 지원하는 봇에는 수집 간격을 요청한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/member/',
          '/hero-preview',
          '/board/*/write',
          '/board/*/*/edit',
          '/*?*q=',
          '/*?*sf=',
          '/*?*page=',
        ],
        crawlDelay: 5,
      },
    ],
  }
}
