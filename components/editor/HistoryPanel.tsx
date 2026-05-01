'use client'

import type { HistoryEntry } from '@/types/editor'

interface HistoryPanelProps {
  history: HistoryEntry[]
}

export default function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <span className="text-xs" style={{ color: '#555566', lineHeight: 1.6 }}>
          No edits yet in this session
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a38 transparent' } as React.CSSProperties}
    >
      {history.map((entry, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-4 py-2.5"
          style={{ borderBottom: '1px solid #1e1e2a' }}
        >
          <div
            className="shrink-0 mt-1"
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c6df0' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium" style={{ color: '#c9d1d9' }}>
                Edited &lt;{entry.tag}&gt;
              </span>
              <span className="text-xs shrink-0" style={{ color: '#555566', fontSize: 11 }}>
                {entry.time}
              </span>
            </div>
            <p
              className="truncate mt-0.5"
              style={{ color: '#666677', fontSize: 11 }}
            >
              {entry.property} → {entry.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
