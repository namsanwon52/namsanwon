'use client'
import { useState } from 'react'
import { formatMonthLabel } from '@/lib/history'
import type { HistoryEntryLike, HistoryYearGroup as YearGroup } from '@/lib/history'

// 같은 라벨(월 또는 월/일)끼리 묶어 왼쪽 라벨을 한 번만 노출한다.
function groupByMonth(entries: HistoryEntryLike[]) {
  const rows: { label: string; items: HistoryEntryLike[] }[] = []
  for (const entry of entries) {
    const label = formatMonthLabel(entry.month, entry.day)
    const last = rows[rows.length - 1]
    if (last && last.label === label) last.items.push(entry)
    else rows.push({ label, items: [entry] })
  }
  return rows
}

export default function HistoryYearGroup({
  group,
  defaultOpen = true,
}: {
  group: YearGroup
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const rows = groupByMonth(group.entries)
  const bodyId = `historyYear-${group.year}`

  return (
    <section className="historyYear">
      <button
        type="button"
        className="historyYearHead"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="historyYearDot" aria-hidden="true" />
        <span className="historyYearLabel">{group.year}</span>
        <span className="historyYearCount">{group.entries.length}건</span>
        <span className={`historyYearToggle${open ? ' isOpen' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="historyYearBody" id={bodyId}>
          {rows.map((row, i) => (
            <div className="historyMonthRow" key={`${row.label}-${i}`}>
              <span className="historyMonth">{row.label}</span>
              <ul className="historyItems">
                {row.items.map((item) => (
                  <li key={item.id}>{item.content}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
