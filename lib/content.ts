/**
 * 크롤링된 레거시 게시글 본문의 깨진 이미지 경로를 Blob URL로 치환한다.
 *
 * 옛 사이트는 이미지를 `/admin/data/bbs/<code>/M<파일>` 절대경로로 참조하는데,
 * 그 서버는 사라졌으므로 그대로 두면 이미지가 깨진다. 마이그레이션으로 원본을
 * Vercel Blob에 올려 File 레코드로 연결해 두었으므로, 파일명(확장자 제외 기준)으로
 * 매칭해 src를 Blob URL로 바꿔준다. DB는 건드리지 않고 렌더 시점에만 변환한다.
 */

type FileRef = { url: string; filename: string };

function baseName(name: string): string {
  // 경로/M(썸네일) 접두사 제거 후 확장자 제거
  const bare = name.replace(/^.*\//, '').replace(/^M/, '');
  return bare.replace(/\.[^.]+$/, '');
}

export function rewritePostContent(content: string, code: string, files: FileRef[]): string {
  if (!content) return content;

  // base 이름 → Blob URL 매핑
  const byBase = new Map<string, string>();
  for (const f of files) byBase.set(baseName(f.filename), f.url);

  let html = content;

  // 1) img src 를 Blob URL 로 치환 (매칭 실패 시 원본 유지)
  const srcRe = new RegExp(`(<img[^>]*\\ssrc=)(['"])([^'"]*/bbs/${code}/[^'"]+)\\2`, 'gi');
  html = html.replace(srcRe, (whole, prefix, quote, srcVal) => {
    const url = byBase.get(baseName(srcVal));
    return url ? `${prefix}${quote}${url}${quote}` : whole;
  });

  // 2) 깨진 viewImg 자바스크립트 링크 무력화 (이미지는 인라인으로 이미 표시됨)
  html = html.replace(/href\s*=\s*["']?javascript:viewImg\([^)]*\);?["']?/gi, 'href="#!"');

  return html;
}
