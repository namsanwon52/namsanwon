import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/hash'

const prisma = new PrismaClient()

async function main() {
  // 관리자 계정 초기 생성
  const adminPassword = await hashPassword('namsan2024!')
  await prisma.admin.upsert({
    where: { email: 'admin@namsanwon.or.kr' },
    update: {},
    create: {
      email: 'admin@namsanwon.or.kr',
      password: adminPassword,
    },
  })
  console.log('✅ 관리자 계정 시딩 완료')

  // 슬라이더 이미지 초기 데이터
  const sliders = [
    { url: '/images/slider-001.jpeg', alt: '남산원 전경 1', order: 1, active: true },
    { url: '/images/slider-002.jpeg', alt: '남산원 전경 2', order: 2, active: true },
    { url: '/images/slider-003.jpeg', alt: '남산원 전경 3', order: 3, active: true },
    { url: '/images/slider-004.jpeg', alt: '남산원 전경 4', order: 4, active: true },
    { url: '/images/slider-005.jpeg', alt: '남산원 일러스트 1', order: 5, active: true },
    { url: '/images/slider-006.jpeg', alt: '남산원 일러스트 2', order: 6, active: true },
    { url: '/images/slider-007.jpeg', alt: '남산원 일러스트 3', order: 7, active: true },
  ]

  for (const s of sliders) {
    await prisma.sliderImage.upsert({
      where: { id: s.order },
      update: s,
      create: s,
    })
  }
  console.log('✅ 슬라이더 이미지 시딩 완료')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
