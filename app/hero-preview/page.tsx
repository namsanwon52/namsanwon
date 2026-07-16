import '@/app/(public)/namsanwon-theme.css'
import { prisma } from '@/lib/prisma'
import HeroSlider from '@/components/namsanwon/HeroSlider'

export const dynamic = 'force-dynamic'

export default async function HeroPreviewPage() {
  const slides = await prisma.sliderImage.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  return <HeroSlider slides={slides} />
}
