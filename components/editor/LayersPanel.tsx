'use client'

import type { DOMTreeNode } from '@/types/editor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, Layers } from 'lucide-react'

interface LayersPanelProps {
  tree: DOMTreeNode[]
  selectedXPath: string | null
  onSelectNode: (xpath: string) => void
}

export default function LayersPanel({ tree, selectedXPath, onSelectNode }: LayersPanelProps) {
  if (tree.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Layers className="h-6 w-6 text-zinc-300" />
        <div>
          <p className="text-[13px] text-zinc-400">No layers yet</p>
          <p className="text-[11px] text-zinc-400 mt-1">Render a component to see its element tree</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      {tree.map((node, i) => {
        const isSelected = node.xpath === selectedXPath
        return (
          <div
            key={i}
            onClick={() => onSelectNode(node.xpath)}
            className={`flex items-center gap-1.5 py-1.5 px-3 cursor-pointer ${isSelected ? 'bg-zinc-100 border-l-2 border-zinc-900' : 'hover:bg-zinc-50 border-l-2 border-transparent'}`}
            style={{ paddingLeft: 12 + node.depth * 12 }}
          >
            <ChevronRight className="h-2.5 w-2.5 text-zinc-300 shrink-0" />
            <span className="text-[11px] font-mono text-zinc-600">{node.tag}</span>
            {node.text && (
              <span className="text-[11px] text-zinc-400 truncate max-w-[120px] ml-1">{node.text}</span>
            )}
          </div>
        )
      })}
    </ScrollArea>
  )
}
