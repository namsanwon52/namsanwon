// 옛 홈페이지(namsanwon.or.kr/01/com04.php ~ com04_7.php)의 시설안내 사진을 옮겨온다.
// 사진은 WebP로 재인코딩해 Cloudinary(facility/*)에 올리고 층/공간 데이터를 만든다.
// 이미 층이 등록돼 있으면 아무것도 하지 않는다. (실행: npm run db:seed-facility)
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { put } from '../lib/storage'
import { optimizeImage } from '../lib/image-optimize'

const prisma = new PrismaClient()

// 기본은 옛 사이트에서 바로 내려받는다. 사이트가 닫힌 뒤에는 미리 받아둔 폴더를
// FACILITY_SRC_DIR로 지정하면 그쪽(`${dir}_ltab${index}.jpg`)에서 읽는다.
const OLD_SITE = 'http://www.namsanwon.or.kr/01'
const SRC_DIR = process.env.FACILITY_SRC_DIR

async function loadPhoto(dir: string, index: number): Promise<Buffer> {
  if (SRC_DIR) return readFile(path.join(SRC_DIR, `${dir}_ltab${index}.jpg`))

  const res = await fetch(`${OLD_SITE}/${dir}/ltab${index}.jpg`)
  if (!res.ok) throw new Error(`사진 내려받기 실패: ${dir}/ltab${index}.jpg (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

// [층 이름, [공간 이름...]] — 옛 사이트 탭/좌측 목록 순서 그대로.
// 파일명은 `${dir}_ltab${index}.jpg` 규칙을 따른다.
const FLOORS: { dir: string; name: string; rooms: string[] }[] = [
  { dir: '01', name: '본관 지상1층', rooms: ['상담실', '양호실', '음악치료실', '심리검사치료실', '캔두도서관'] },
  { dir: '02', name: '본관 지상2층', rooms: ['룻방', '한나방', '바울방'] },
  { dir: '03', name: '본관 지상3층', rooms: ['다윗방', '학습실', '솔로몬방'] },
  { dir: '04', name: '본관 지하1층', rooms: ['식당', '조리실', '장근석홀'] },
  { dir: '05', name: '신관 지상1층', rooms: ['자립체험홈'] },
  { dir: '06', name: '신관 지상2층', rooms: ['자립체험홈'] },
  { dir: '07', name: '별도사진', rooms: ['강당내부', '다람쥐놀이터 무대', '도서실', '솔로몬방', '세탁실', '캔두하우스'] },
]

async function main() {
  const existing = await prisma.facilityFloor.count()
  if (existing > 0) {
    console.log(`이미 층 ${existing}개가 등록되어 있어 시드를 건너뜁니다.`)
    return
  }

  for (const [floorIndex, floorSpec] of FLOORS.entries()) {
    const floor = await prisma.facilityFloor.create({
      data: { name: floorSpec.name, order: floorIndex + 1 },
    })

    for (const [roomIndex, roomName] of floorSpec.rooms.entries()) {
      const raw = await loadPhoto(floorSpec.dir, roomIndex)
      const optimized = await optimizeImage(raw, `${floorSpec.dir}-${roomIndex}.jpg`)
      const uploaded = await put(`facility/${floorSpec.dir}-${roomIndex}-${optimized.filename}`, optimized.data, {
        contentType: optimized.contentType,
      })

      await prisma.facilityRoom.create({
        data: {
          floorId: floor.id,
          name: roomName,
          imageUrl: uploaded.url,
          imageAlt: `${floorSpec.name} ${roomName}`,
          order: roomIndex + 1,
        },
      })

      const kb = (n: number) => `${Math.round(n / 1024)}KB`
      console.log(`${floorSpec.name} / ${roomName}: ${kb(raw.length)} → ${kb(optimized.data.length)}`)
    }
  }

  const rooms = await prisma.facilityRoom.count()
  console.log(`층 ${FLOORS.length}개, 공간 ${rooms}곳을 등록했습니다.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
