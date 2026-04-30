'use client'

import type { DOMTreeNode } from '@/types/editor'

interface LayersPanelProps {
  tree: DOMTreeNode[]
  selectedXPath: string | null
  onSelectNode: (xpath: string) => void
}

export default function LayersPanel({ tree, selectedXPath, onSelectNode }: LayersPanelProps) {
  if (tree.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <span className="text-xs" style={{ color: '#555566', lineHeight: 1.6 }}>
          Render a component to see its element tree
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a38 transparent' } as React.CSSProperties}
    >
      {tree.map((node, i) => {
        const isSelected = node.xpath === selectedXPath
        return (
          <div
            key={i}
            onClick={() => onSelectNode(node.xpath)}
            className="flex items-baseline gap-2 py-1.5 cursor-pointer"
            style={{
              paddingLeft: node.depth * 14 + 10,
              paddingRight: 10,
              background: isSelected ? 'rgba(124, 109, 240, 0.12)' : 'transparent',
              borderLeft: isSelected ? '2px solid #7c6df0' : '2px solid transparent',
            }}
          >
            <span
              className="text-xs shrink-0"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: isSelected ? '#a99ff5' : '#7c6df0',
              }}
            >
              {'<'}{node.tag}{'>'}
            </span>
            {node.text && (
              <span
                className="text-xs truncate"
                style={{ color: '#555566', maxWidth: 120 }}
              >
                {node.text}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
