import { prisma } from '@/lib/prisma'
import FloorForm from './FloorForm'
import FloorCard from './FloorCard'

export const dynamic = 'force-dynamic'

export default async function AdminFacilityPage() {
  const floors = await prisma.facilityFloor.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: { rooms: { orderBy: [{ order: 'asc' }, { id: 'asc' }] } },
  })
  const roomCount = floors.reduce((sum, f) => sum + f.rooms.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1b1c1c]">시설안내 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          남산원소개 &gt; 시설안내 페이지의 층 탭과 공간 사진입니다. 층 {floors.length}개 / 공간 {roomCount}곳
        </p>
      </div>

      <FloorForm />

      {floors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-xl shadow-sm">
          등록된 층이 없습니다. 위에서 층을 먼저 추가해 주세요.
        </p>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => (
            <FloorCard key={floor.id} floor={floor} />
          ))}
        </div>
      )}
    </div>
  )
}
