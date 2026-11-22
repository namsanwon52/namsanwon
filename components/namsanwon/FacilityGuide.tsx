import { prisma } from '@/lib/prisma'
import { cachedQuery, CACHE_TAGS } from '@/lib/cache'
import FacilityViewer from './FacilityViewer'

// 관리자(시설안내 관리)에서 등록한 층/공간을 층 탭 + 공간 목록 + 사진으로 렌더한다.
const getFloors = cachedQuery('facility-floors', [CACHE_TAGS.facility], () =>
  prisma.facilityFloor.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: {
      rooms: {
        where: { active: true },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, imageUrl: true, imageAlt: true },
      },
    },
  })
)

export default async function FacilityGuide() {
  const floors = await getFloors()

  const withRooms = floors.filter((floor) => floor.rooms.length > 0)

  if (withRooms.length === 0) {
    return (
      <div className="contentCard">
        <p className="emptyNote">등록된 시설 사진이 없습니다.</p>
      </div>
    )
  }

  return (
    <FacilityViewer
      floors={withRooms.map((floor) => ({ id: floor.id, name: floor.name, rooms: floor.rooms }))}
    />
  )
}
