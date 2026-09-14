// 크롤링 때 갤러리(com3) 본문이 사진 뒤에서 잘려 글 내용이 빠진 게시글을 복구한다.
// 옛 사이트(namsanwon.or.kr/05/commu06.php?ptype=view&idx=…)에서 본문 텍스트를 가져와
// 잘린 꼬리(<table id='wiz_get_table_width'>…)를 떼고 사진 아래에 붙인다.
// 실행: npx tsx --env-file=.env prisma/restore-gallery-text.ts [--dry] [--limit=N]
import { writeFile } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_VIEW = 'http://www.namsanwon.or.kr/05/commu06.php?ptype=view&idx='
const DRY = process.argv.includes('--dry')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0)
const CONCURRENCY = 6

const TRUNCATED_TAIL = /\s*<table[^>]*id=['"]?wiz_get_table_width['"]?[\s\S]*$/i
const BODY_RE =
  /<td align="left" style="padding-top:5px">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>\s*<table width="100%" border="0" cellpadding="0" cellspacing="0">/

function hasText(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
}

async function fetchOldBody(idx: number): Promise<string | null> {
  const res = await fetch(OLD_VIEW + idx)
  if (!res.ok) return null
  const m = (await res.text()).match(BODY_RE)
  if (!m) return null
  const body = m[1].trim()
  // 옛 글은 태그 없이 줄바꿈만 있는 평문이라 <br>로 바꿔야 줄이 유지된다.
  return /<(p|br|div)\b/i.test(body) ? body : body.replace(/\r?\n/g, '<br>\n')
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { code: 'com3', content: { contains: 'wiz_get_table_width' } },
    select: { id: true, content: true },
    orderBy: { id: 'desc' },
  })
  const targets = posts.filter((p) => !/<\/table>/i.test(p.content) && !hasText(p.content))
  const queue = LIMIT ? targets.slice(0, LIMIT) : targets
  console.log(`대상 ${targets.length}건 중 ${queue.length}건 처리${DRY ? ' (dry run)' : ''}`)

  if (!DRY) {
    const file = `restore-gallery-text-backup-${Date.now()}.json`
    await writeFile(file, JSON.stringify(queue))
    console.log(`원본 백업: ${file}`)
  }

  let restored = 0, empty = 0, failed = 0
  let cursor = 0

  async function worker() {
    while (cursor < queue.length) {
      const p = queue[cursor++]
      try {
        const body = await fetchOldBody(p.id)
        if (body === null) { failed++; console.warn(`실패 ${p.id}`); continue }
        if (!hasText(body)) { empty++; continue }
        const content = `${p.content.replace(TRUNCATED_TAIL, '')}\n<div class="postText">${body}</div>`
        if (DRY) {
          console.log(`--- ${p.id}\n${body.slice(0, 200)}`)
        } else {
          await prisma.post.update({ where: { id: p.id }, data: { content } })
        }
        restored++
      } catch (e) {
        failed++
        console.warn(`오류 ${p.id}`, (e as Error).message)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log({ restored, empty, failed })
}

main().finally(() => prisma.$disconnect())
