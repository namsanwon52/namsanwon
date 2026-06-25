/**
 * migration-data.json → PostgreSQL(Prisma) Post 마이그레이션
 *
 * 사전 요건: npx tsx prisma/parse-sql.ts 실행 후 migration-data.json 생성
 *
 * 실행: npx tsx prisma/migrate-from-old.ts [--dry-run] [--reset]
 *   --dry-run : DB 저장 없이 확인만
 *   --reset   : progress 초기화 후 처음부터
 *
 * 중단 후 재실행하면 progress 파일을 읽어 이어서 진행합니다.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const DATA_FILE     = path.join(__dirname, 'migration-data.json')
const PROGRESS_FILE = path.join(__dirname, 'migration-progress.json')
const BATCH_NO_FILES = 500
const CONCURRENCY    = 10  // 안정적인 동시성

interface PostData {
  category: string; title: string; content: string; author: string
  password: null; isAdmin: boolean; views: number; createdAt: string
}

interface MigrationRow {
  post: PostData
  files?: { url: string; filename: string }[]
}

interface MigrationData {
  withFiles: MigrationRow[]
  withoutFiles: MigrationRow[]
  parsedAt: string
}

interface Progress {
  noFilesDone: number
  withFilesDone: number
}

function loadProgress(): Progress {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) }
  catch { return { noFilesDone: 0, withFilesDone: 0 } }
}

function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2))
}

async function main() {
  const dryRun  = process.argv.includes('--dry-run')
  const doReset = process.argv.includes('--reset')

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`데이터 파일 없음: ${DATA_FILE}\n먼저 npx tsx prisma/parse-sql.ts 실행`)
  }

  if (doReset) {
    try { fs.unlinkSync(PROGRESS_FILE) } catch {}
    console.log('progress 초기화 완료')
  }

  console.log(`데이터 파일 읽는 중...`)
  const data: MigrationData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  const { withFiles, withoutFiles } = data

  console.log(`총 ${withoutFiles.length + withFiles.length}건 (파일 없음: ${withoutFiles.length}, 파일 있음: ${withFiles.length})`)
  console.log(`파싱일: ${data.parsedAt}`)

  if (dryRun) {
    console.log('\n(DRY RUN 종료)')
    return
  }

  const prog = loadProgress()
  if (prog.noFilesDone > 0 || prog.withFilesDone > 0) {
    console.log(`\n이전 진행 이어서: 파일없음 ${prog.noFilesDone}/${withoutFiles.length}, 파일있음 ${prog.withFilesDone}/${withFiles.length}`)
  }

  // ── 파일 없는 게시글 → createMany ────────────────────────────────────
  if (prog.noFilesDone < withoutFiles.length) {
    console.log('\n[1단계] 파일 없는 게시글 배치 삽입...')
    for (let i = prog.noFilesDone; i < withoutFiles.length; i += BATCH_NO_FILES) {
      const batch = withoutFiles.slice(i, i + BATCH_NO_FILES).map(r => ({
        ...r.post,
        createdAt: new Date(r.post.createdAt),
        updatedAt: new Date(r.post.createdAt),
      }))
      await prisma.post.createMany({ data: batch })
      prog.noFilesDone = Math.min(i + BATCH_NO_FILES, withoutFiles.length)
      saveProgress(prog)
      console.log(`  ${prog.noFilesDone}/${withoutFiles.length}건`)
    }
    console.log('  ✓ 완료')
  } else {
    console.log(`\n[1단계] 이미 완료 (${withoutFiles.length}건)`)
  }

  // ── 파일 있는 게시글 → 동시 삽입 ────────────────────────────────────
  console.log('\n[2단계] 첨부파일 포함 게시글 삽입...')
  const startWF = prog.withFilesDone

  let consecutiveErrors = 0
  for (let i = startWF; i < withFiles.length; i += CONCURRENCY) {
    const chunk = withFiles.slice(i, i + CONCURRENCY)
    try {
      await Promise.all(
        chunk.map(r =>
          prisma.post.create({
            data: {
              ...r.post,
              createdAt: new Date(r.post.createdAt),
              updatedAt: new Date(r.post.createdAt),
              files: r.files ? { create: r.files } : undefined,
            },
          })
        )
      )
      prog.withFilesDone = i + chunk.length
      saveProgress(prog)
      consecutiveErrors = 0

      if (prog.withFilesDone % 100 === 0 || prog.withFilesDone >= withFiles.length) {
        console.log(`  ${prog.withFilesDone}/${withFiles.length}건`)
      }
    } catch (err) {
      consecutiveErrors++
      const errMsg = (err as Error).message ?? String(err)
      console.error(`\n  배치 오류 (i=${i}, 연속오류=${consecutiveErrors}): ${errMsg.substring(0, 200)}`)

      if (consecutiveErrors >= 3) {
        console.error('\n  연속 오류 3회 → 중단 (다음 실행 시 재개)')
        break
      }
      // 오류 시 10초 대기 후 재시도 (같은 배치 재시도 아니라 다음으로 진행)
      await new Promise(r => setTimeout(r, 10000))
    }
  }

  // ── 완료 ─────────────────────────────────────────────────────────────
  console.log('\n=== 마이그레이션 완료 ===')
  console.log(`파일 없음: ${prog.noFilesDone}건, 파일 있음: ${prog.withFilesDone}건`)
  console.log(`총 삽입: ${prog.noFilesDone + prog.withFilesDone}건`)

  try { fs.unlinkSync(PROGRESS_FILE) } catch {}
  console.log('✓ 완료')
}

main()
  .catch(err => { console.error('오류:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
