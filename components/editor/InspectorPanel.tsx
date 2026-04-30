'use client'

import { useState, useEffect } from 'react'
import type { SelectedElement } from '@/types/editor'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: '#44445a' }}
      >
        {children}
      </span>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pb-3">
      <label className="text-xs block mb-1.5" style={{ color: '#777788' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ColorPair({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 28,
          height: 28,
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          borderRadius: 4,
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded px-2 py-1.5 text-xs outline-none"
        style={{ background: '#0f0f13', color: '#c9d1d9', border: '1px solid #2a2a38' }}
      />
    </div>
  )
}

const INPUT_STYLE = { background: '#0f0f13', color: '#c9d1d9', border: '1px solid #2a2a38' }
const FONT_WEIGHT_OPTIONS = [['Light', '300'], ['Regular', '400'], ['Semi', '600'], ['Bold', '700']] as const
const TEXT_ALIGN_OPTIONS = ['Left', 'Center', 'Right'] as const

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-2">
        <span style={{ fontSize: 22, lineHeight: 1 }}>🖱️</span>
        <span className="text-xs" style={{ color: '#555566', lineHeight: 1.6 }}>
          Click any element in the preview to edit its properties
        </span>
      </div>
    )
  }

  const xpath = selectedElement.xpath

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a38 transparent' } as React.CSSProperties}
    >
      {/* Text */}
      {selectedElement.isTextElement && (
        <div style={{ borderBottom: '1px solid #2a2a38' }}>
          <SectionLabel>Text</SectionLabel>
          <Row label="Content">
            <textarea
              value={text}
              rows={3}
              onChange={(e) => {
                setText(e.target.value)
                onApplyStyle(xpath, {}, e.target.value)
              }}
              className="w-full rounded px-2 py-1.5 text-xs outline-none resize-none"
              style={INPUT_STYLE}
            />
          </Row>
        </div>
      )}

      {/* Typography */}
      <div style={{ borderBottom: '1px solid #2a2a38' }}>
        <SectionLabel>Typography</SectionLabel>

        <Row label={`Font Size — ${fontSize}px`}>
          <input
            type="range"
            min={8}
            max={72}
            value={fontSize}
            onChange={(e) => {
              const v = Number(e.target.value)
              setFontSize(v)
              onApplyStyle(xpath, { fontSize: v + 'px' })
            }}
            className="w-full"
          />
        </Row>

        <Row label="Font Weight">
          <div className="flex gap-1">
            {FONT_WEIGHT_OPTIONS.map(([label, val]) => (
              <button
                key={val}
                onClick={() => { setFontWeight(val); onApplyStyle(xpath, { fontWeight: val }) }}
                className="flex-1 text-xs py-1 rounded"
                style={{
                  background: fontWeight === val ? '#7c6df0' : 'transparent',
                  color: fontWeight === val ? '#fff' : '#aaaaaa',
                  border: '1px solid #2a2a38',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Text Color">
          <ColorPair
            value={color}
            onChange={(v) => { setColor(v); onApplyStyle(xpath, { color: v }) }}
          />
        </Row>

        <Row label="Text Align">
          <div className="flex gap-1">
            {TEXT_ALIGN_OPTIONS.map((label) => {
              const val = label.toLowerCase()
              return (
                <button
                  key={val}
                  onClick={() => { setTextAlign(val); onApplyStyle(xpath, { textAlign: val }) }}
                  className="flex-1 text-xs py-1 rounded"
                  style={{
                    background: textAlign === val ? '#7c6df0' : 'transparent',
                    color: textAlign === val ? '#fff' : '#aaaaaa',
                    border: '1px solid #2a2a38',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Row>
      </div>

      {/* Background */}
      <div style={{ borderBottom: '1px solid #2a2a38' }}>
        <SectionLabel>Background</SectionLabel>
        <Row label="Background Color">
          <ColorPair
            value={backgroundColor}
            onChange={(v) => { setBackgroundColor(v); onApplyStyle(xpath, { backgroundColor: v }) }}
          />
        </Row>
      </div>

      {/* Spacing */}
      <div style={{ borderBottom: '1px solid #2a2a38' }}>
        <SectionLabel>Spacing</SectionLabel>

        <Row label={`Padding — ${padding}px`}>
          <input
            type="range"
            min={0}
            max={80}
            value={padding}
            onChange={(e) => {
              const v = Number(e.target.value)
              setPadding(v)
              onApplyStyle(xpath, { padding: v + 'px' })
            }}
            className="w-full"
          />
        </Row>

        <Row label={`Border Radius — ${borderRadius}px`}>
          <input
            type="range"
            min={0}
            max={40}
            value={borderRadius}
            onChange={(e) => {
              const v = Number(e.target.value)
              setBorderRadius(v)
              onApplyStyle(xpath, { borderRadius: v + 'px' })
            }}
            className="w-full"
          />
        </Row>

        <Row label="Width">
          <input
            type="text"
            value={width}
            placeholder="auto"
            onChange={(e) => {
              setWidth(e.target.value)
              onApplyStyle(xpath, { width: e.target.value })
            }}
            className="w-full rounded px-2 py-1.5 text-xs outline-none"
            style={INPUT_STYLE}
          />
        </Row>
      </div>

      {/* Border */}
      <div style={{ paddingBottom: 16 }}>
        <SectionLabel>Border</SectionLabel>

        <Row label={`Border Width — ${borderWidth}px`}>
          <input
            type="range"
            min={0}
            max={8}
            value={borderWidth}
            onChange={(e) => {
              const v = Number(e.target.value)
              setBorderWidth(v)
              onApplyStyle(xpath, { borderWidth: v + 'px' })
            }}
            className="w-full"
          />
        </Row>

        <Row label="Border Color">
          <ColorPair
            value={borderColor}
            onChange={(v) => { setBorderColor(v); onApplyStyle(xpath, { borderColor: v }) }}
          />
        </Row>
      </div>
    </div>
  )
}
