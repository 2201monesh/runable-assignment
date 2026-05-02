'use client'

import type { HistoryEntry } from '@/types/editor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'

interface HistoryPanelProps {
  history: HistoryEntry[]
}

export default function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Clock className="h-6 w-6 text-zinc-300" />
        <p className="text-[13px] text-zinc-400">No edits yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      {history.map((entry, i) => (
        <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-zinc-50 hover:bg-zinc-50">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-zinc-600">
              Edited <span className="font-mono bg-zinc-100 px-1 rounded text-zinc-800">{entry.tag}</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{entry.property} → {entry.value}</p>
          </div>
          <span className="text-[11px] text-zinc-400 shrink-0 mt-0.5">{entry.time}</span>
        </div>
      ))}
    </ScrollArea>
  )
}
