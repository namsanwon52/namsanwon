/**
 * SQL 덤프 → migration-data.json 변환기 (1회 실행)
 *
 * 실행: npx tsx prisma/parse-sql.ts
 * 출력: prisma/migration-data.json
 */

import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'

const CATEGORY_MAP: Record<string, string> = {
  nt1: 'notice', nt2: 'corporation', nt3: 'corporation', nt4: 'corporation',
  com1: 'free', com3: 'gallery', com5: 'notice', com6: 'gallery', schedule: 'notice',
}

const ADMIN_MEMIDS = new Set(['admin', 'namsanwon1', 'namsan'])
const OLD_FILE_BASE = 'http://namsanwon.or.kr/bbs/upfile'

const COL = {
  idx: 0, code: 1, notice: 5, memid: 7, name: 9,
  subject: 16, content: 17,
  upfile_start: 26, upfile_name_start: 38,
  count: 54, wdate: 58,
} as const

function* parseRows(valStr: string): Generator<(string | null)[]> {
  let i = 0
  const len = valStr.length

  while (i < len) {
    while (i < len && valStr[i] !== '(') i++
    if (i >= len) break
    i++

    const row: (string | null)[] = []
    outer: while (i < len) {
      while (i < len && (valStr[i] === ' ' || valStr[i] === '\t')) i++
      if (i >= len) break

      switch (valStr[i]) {
        case ')': i++; break outer
        case ',': i++; break
        default:
          if (valStr.substring(i, i + 4) === 'NULL') {
            row.push(null); i += 4
          } else if (valStr[i] === "'") {
            i++
            const chars: string[] = []
            while (i < len) {
              const ch = valStr[i]
              if (ch === '\\') {
                i++
                switch (valStr[i] ?? '') {
                  case "'":  chars.push("'");  break
                  case '\\': chars.push('\\'); break
                  case 'n':  chars.push('\n'); break
                  case 'r':  chars.push('\r'); break
                  case 't':  chars.push('\t'); break
                  case '0':  chars.push('\0'); break
                  default:   chars.push(valStr[i] ?? '')
                }
                i++
              } else if (ch === "'") { i++; break }
              else { chars.push(ch); i++ }
            }
            row.push(chars.join(''))
          } else {
            let val = ''
            while (i < len && valStr[i] !== ',' && valStr[i] !== ')') val += valStr[i++]
            const t = val.trim()
            row.push(t === '' ? null : t)
          }
      }
    }
    if (row.length > 0) yield row
  }
}

async function main() {
  const sqlPath    = path.join(__dirname, '../docs/sql/260513_namsan.sql')
  const outputPath = path.join(__dirname, 'migration-data.json')

  console.log('SQL 파일 파싱 시작...')
  const t0 = Date.now()

  const withFiles: object[]    = []
  const withoutFiles: object[] = []
  let skipped = 0

  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line.startsWith('INSERT INTO `wiz_bbs` VALUES ')) continue
    const valStr = line.slice('INSERT INTO `wiz_bbs` VALUES '.length).replace(/;$/, '')

    for (const row of parseRows(valStr)) {
      const code = row[COL.code] ?? ''
      const category = CATEGORY_MAP[code]
      if (!category) { skipped++; continue }

      const subject = (row[COL.subject] ?? '').trim()
      const content = row[COL.content] ?? ''
      if (!subject || !content.trim()) { skipped++; continue }

      const memid   = row[COL.memid] ?? ''
      const name    = (row[COL.name] ?? '').trim() || '익명'
      const views   = parseInt(row[COL.count] ?? '0') || 0
      const wdate   = row[COL.wdate]
      const notice  = row[COL.notice]

      const isAdmin   = notice === 'Y' || ADMIN_MEMIDS.has(memid)
      const createdAt = wdate && wdate !== '0'
        ? new Date(parseInt(wdate) * 1000).toISOString() : new Date('1990-01-01').toISOString()

      const files: { url: string; filename: string }[] = []
      for (let fi = 0; fi < 12; fi++) {
        const hash  = row[COL.upfile_start + fi]?.trim()
        const fname = row[COL.upfile_name_start + fi]?.trim()
        if (hash && fname) files.push({ url: `${OLD_FILE_BASE}/${hash}`, filename: fname })
      }

      const post = {
        category, title: subject.substring(0, 500), content,
        author: name.substring(0, 100), password: null,
        isAdmin, views, createdAt,
      }

      if (files.length > 0) withFiles.push({ post, files })
      else withoutFiles.push({ post })
    }
  }

  const data = { withFiles, withoutFiles, parsedAt: new Date().toISOString() }
  fs.writeFileSync(outputPath, JSON.stringify(data))

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const sizeMB  = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)

  console.log(`파싱 완료 (${elapsed}초)`)
  console.log(`파일 없음: ${withoutFiles.length}건, 파일 있음: ${withFiles.length}건, 건너뜀: ${skipped}건`)
  console.log(`출력: ${outputPath} (${sizeMB}MB)`)
}

main().catch(err => { console.error(err); process.exit(1) })
