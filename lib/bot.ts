// User-Agent로 검색엔진·크롤러·스크립트 요청을 구분한다.
// 조회수처럼 사람의 방문만 세야 하는 쓰기 작업을 봇 요청에서 건너뛰는 데 쓴다.
const BOT_RE =
  /bot|crawl|spider|slurp|scrap|fetch|preview|headless|lighthouse|facebookexternalhit|yeti|daumoa|python|curl|wget|httpclient|okhttp|go-http|java\/|axios|libwww|node|postman/i

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || !ua.trim()) return true
  return BOT_RE.test(ua)
}
