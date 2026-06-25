import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import SliderControls from './SliderControls'

export default async function AdminSliderPage() {
  const images = await prisma.sliderImage.findMany({ orderBy: { order: 'asc' } })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#3D2B1F]">슬라이더 이미지 관리</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={img.url} alt={img.alt} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3D2B1F]">{img.alt}</p>
              <p className="text-xs text-gray-400 mt-1">순서: {img.order}</p>
            </div>
            <SliderControls id={img.id} active={img.active} />
          </div>
        ))}
      </div>
    </div>
  )
}
