import { prisma } from '@/lib/prisma'
import { groupEntriesByYear } from '@/lib/history'
import HistoryYearGroup from './HistoryYearGroup'

// 관리자(연혁 관리)에서 등록한 HistoryEntry를 연도별 타임라인으로 렌더한다.
export default async function HistoryTimeline() {
  const entries = await prisma.historyEntry.findMany({ where: { active: true } })

  if (entries.length === 0) {
    return (
      <div className="contentCard">
        <p className="emptyNote">등록된 연혁이 없습니다.</p>
      </div>
    )
  }

  const groups = groupEntriesByYear(entries)

  return (
    <div className="contentCard historyTimeline">
      {groups.map((group, i) => (
        <HistoryYearGroup key={group.year} group={group} defaultOpen={i < 3} />
      ))}
    </div>
  )
}
