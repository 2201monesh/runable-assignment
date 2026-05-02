'use client'

import { useState, useEffect } from 'react'
import type { SelectedElement } from '@/types/editor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlignLeft, AlignCenter, AlignRight, MousePointer2 } from 'lucide-react'

interface InspectorPanelProps {
  selectedElement: SelectedElement | null
  onApplyStyle: (xpath: string, styles: Record<string, string>, text?: string) => void
}

function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'transparent') return '#000000'
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return '#000000'
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
}

const FONT_WEIGHT_OPTIONS = [['Light', '300'], ['Regular', '400'], ['Semi', '600'], ['Bold', '700']] as const

export default function InspectorPanel({ selectedElement, onApplyStyle }: InspectorPanelProps) {
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [fontWeight, setFontWeight] = useState('400')
  const [color, setColor] = useState('#000000')
  const [textAlign, setTextAlign] = useState('left')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [padding, setPadding] = useState(0)
  const [borderRadius, setBorderRadius] = useState(0)
  const [width, setWidth] = useState('auto')
  const [borderWidth, setBorderWidth] = useState(0)
  const [borderColor, setBorderColor] = useState('#000000')

  useEffect(() => {
    if (!selectedElement) return
    const s = selectedElement.styles
    setText(selectedElement.text)
    setFontSize(parseInt(s.fontSize) || 16)
    setFontWeight(s.fontWeight || '400')
    setColor(rgbToHex(s.color))
    setTextAlign((s.textAlign || 'left').toLowerCase())
    setBackgroundColor(rgbToHex(s.backgroundColor))
    setPadding(parseInt(s.padding) || 0)
    setBorderRadius(parseInt(s.borderRadius) || 0)
    setWidth(s.width || 'auto')
    setBorderWidth(parseInt(s.borderWidth) || 0)
    setBorderColor(rgbToHex(s.borderColor))
  }, [selectedElement])

  if (!selectedElement) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center px-4 border-b" style={{ height: 40 }}>
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Inspector</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <MousePointer2 className="h-6 w-6 text-zinc-300" />
          <div>
            <p className="text-sm font-medium text-zinc-400">Select an element</p>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Click any element in the preview to inspect and edit it
            </p>
          </div>
        </div>
      </div>
    )
  }

  const xpath = selectedElement.xpath

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center px-4 border-b" style={{ height: 40 }}>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Inspector</span>
      </div>

      {/* Selected element header */}
      <div className="px-4 py-3 border-b bg-zinc-50 flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs rounded-full">{selectedElement.tag}</Badge>
        <span className="text-[11px] text-zinc-400 truncate max-w-[140px]">{selectedElement.text}</span>
      </div>

      <ScrollArea className="flex-1">
        {/* Content */}
        {selectedElement.isTextElement && (
          <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Content</p>
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Text</Label>
            <Textarea
              value={text}
              className="text-xs resize-none min-h-[60px]"
              onChange={(e) => {
                setText(e.target.value)
                onApplyStyle(xpath, {}, e.target.value)
              }}
            />
          </div>
        )}

        {/* Typography */}
        <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Typography</p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] text-zinc-500">Font Size</Label>
              <span className="text-[11px] text-zinc-400 tabular-nums">{fontSize}px</span>
            </div>
            <Slider
              className="my-1"
              min={8}
              max={72}
              step={1}
              value={[fontSize]}
              onValueChange={(vals) => {
                const v = (vals as number[])[0]
                setFontSize(v)
                onApplyStyle(xpath, { fontSize: v + 'px' })
              }}
            />
          </div>

          <div className="mb-3">
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Font Weight</Label>
            <div className="grid grid-cols-4 gap-1">
              {FONT_WEIGHT_OPTIONS.map(([label, val]) => (
                <Button
                  key={val}
                  variant={fontWeight === val ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-0"
                  onClick={() => { setFontWeight(val); onApplyStyle(xpath, { fontWeight: val }) }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Text Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => { setColor(e.target.value); onApplyStyle(xpath, { color: e.target.value }) }}
                className="w-8 h-8 rounded cursor-pointer border border-zinc-200 p-0.5"
              />
              <Input
                value={color}
                onChange={(e) => { setColor(e.target.value); onApplyStyle(xpath, { color: e.target.value }) }}
                className="h-7 text-xs font-mono flex-1"
              />
            </div>
          </div>

          <div className="mb-2">
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Text Align</Label>
            <div className="grid grid-cols-3 gap-1">
              {(['left', 'center', 'right'] as const).map((val) => {
                const Icon = val === 'left' ? AlignLeft : val === 'center' ? AlignCenter : AlignRight
                return (
                  <Button
                    key={val}
                    variant={textAlign === val ? 'default' : 'outline'}
                    size="sm"
                    className="h-7"
                    onClick={() => { setTextAlign(val); onApplyStyle(xpath, { textAlign: val }) }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Background</p>
          <Label className="text-[11px] text-zinc-500 mb-1.5 block">Background Color</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => { setBackgroundColor(e.target.value); onApplyStyle(xpath, { backgroundColor: e.target.value }) }}
              className="w-8 h-8 rounded cursor-pointer border border-zinc-200 p-0.5"
            />
            <Input
              value={backgroundColor}
              onChange={(e) => { setBackgroundColor(e.target.value); onApplyStyle(xpath, { backgroundColor: e.target.value }) }}
              className="h-7 text-xs font-mono flex-1"
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Spacing</p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] text-zinc-500">Padding</Label>
              <span className="text-[11px] text-zinc-400 tabular-nums">{padding}px</span>
            </div>
            <Slider
              className="my-1"
              min={0}
              max={80}
              step={1}
              value={[padding]}
              onValueChange={(vals) => {
                const v = (vals as number[])[0]
                setPadding(v)
                onApplyStyle(xpath, { padding: v + 'px' })
              }}
            />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] text-zinc-500">Border Radius</Label>
              <span className="text-[11px] text-zinc-400 tabular-nums">{borderRadius}px</span>
            </div>
            <Slider
              className="my-1"
              min={0}
              max={40}
              step={1}
              value={[borderRadius]}
              onValueChange={(vals) => {
                const v = (vals as number[])[0]
                setBorderRadius(v)
                onApplyStyle(xpath, { borderRadius: v + 'px' })
              }}
            />
          </div>

          <div className="mb-2">
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Width</Label>
            <Input
              value={width}
              placeholder="auto"
              onChange={(e) => {
                setWidth(e.target.value)
                onApplyStyle(xpath, { width: e.target.value })
              }}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        {/* Border */}
        <div className="px-4 pt-4 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Border</p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] text-zinc-500">Border Width</Label>
              <span className="text-[11px] text-zinc-400 tabular-nums">{borderWidth}px</span>
            </div>
            <Slider
              className="my-1"
              min={0}
              max={8}
              step={1}
              value={[borderWidth]}
              onValueChange={(vals) => {
                const v = (vals as number[])[0]
                setBorderWidth(v)
                onApplyStyle(xpath, { borderWidth: v + 'px' })
              }}
            />
          </div>

          <div>
            <Label className="text-[11px] text-zinc-500 mb-1.5 block">Border Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => { setBorderColor(e.target.value); onApplyStyle(xpath, { borderColor: e.target.value }) }}
                className="w-8 h-8 rounded cursor-pointer border border-zinc-200 p-0.5"
              />
              <Input
                value={borderColor}
                onChange={(e) => { setBorderColor(e.target.value); onApplyStyle(xpath, { borderColor: e.target.value }) }}
                className="h-7 text-xs font-mono flex-1"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
