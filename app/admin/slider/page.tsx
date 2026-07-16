import { prisma } from '@/lib/prisma'
import SliderForm from './SliderForm'
import SliderItemCard from './SliderItemCard'
import SliderPreview from './SliderPreview'

export default async function AdminSliderPage() {
  const images = await prisma.sliderImage.findMany({ orderBy: { order: 'asc' } })
  const hasActive = images.some((img) => img.active)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">슬라이더 이미지 관리</h1>
      <SliderForm />
      {images.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">등록된 슬라이더 이미지가 없습니다.</p>
      )}
      <div className="grid grid-cols-1 gap-4">
        {images.map((img) => (
          <SliderItemCard key={img.id} image={img} />
        ))}
      </div>

      <div className="space-y-2 pt-4">
        <h2 className="text-lg font-bold text-[#3D2B1F]">미리보기</h2>
        {!hasActive ? (
          <p className="text-sm text-gray-400 text-center py-8 bg-white rounded-xl shadow-sm">
            활성화된 슬라이더 이미지가 없어 미리볼 수 없습니다.
          </p>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-sm">
            <SliderPreview />
          </div>
        )}
      </div>
    </div>
  )
}
