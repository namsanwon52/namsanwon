'use client'
import { useState } from 'react'

type Room = { id: number; name: string; imageUrl: string; imageAlt: string }
type Floor = { id: number; name: string; rooms: Room[] }

export default function FacilityViewer({ floors }: { floors: Floor[] }) {
  const [floorId, setFloorId] = useState(floors[0].id)
  const [roomId, setRoomId] = useState(floors[0].rooms[0].id)

  const floor = floors.find((f) => f.id === floorId) ?? floors[0]
  const room = floor.rooms.find((r) => r.id === roomId) ?? floor.rooms[0]

  // 층을 바꾸면 그 층의 첫 공간을 보여준다.
  function selectFloor(next: Floor) {
    setFloorId(next.id)
    setRoomId(next.rooms[0].id)
  }

  return (
    <div className="contentCard facilityGuide">
      <div className="facilityFloorTabs" role="tablist" aria-label="층 선택">
        {floors.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === floor.id}
            className={f.id === floor.id ? 'isActive' : ''}
            onClick={() => selectFloor(f)}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="facilityBody">
        <div className="facilityRoomList" role="tablist" aria-label={`${floor.name} 공간 선택`}>
          {floor.rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === room.id}
              className={r.id === room.id ? 'isActive' : ''}
              onClick={() => setRoomId(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>

        <figure className="facilityPhoto">
          {/* 사진 비율이 제각각이라 next/image 대신 자연 비율을 유지한다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={room.imageUrl} alt={room.imageAlt || `${floor.name} ${room.name}`} />
          <figcaption>{room.name}</figcaption>
        </figure>
      </div>
    </div>
  )
}
