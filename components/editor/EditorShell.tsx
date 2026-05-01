'use client'

import { useState, useRef, useEffect } from 'react'
import type { SelectedElement, DOMTreeNode, HistoryEntry } from '@/types/editor'
import InspectorPanel from '@/components/editor/InspectorPanel'
import LayersPanel from '@/components/editor/LayersPanel'
import HistoryPanel from '@/components/editor/HistoryPanel'
import { buildIframeContent } from '@/lib/buildIframeContent'

const DEFAULT_JSX = `function MyComponent() {
  return (
    <div style={{padding: '48px', background: '#f5f7fa', minHeight: '100vh', fontFamily: 'system-ui, sans-serif'}}>
      <h1 style={{color: '#1a1a2e', fontSize: '36px', fontWeight: '700', marginBottom: '16px'}}>
        Hello, World!
      </h1>
      <p style={{color: '#555', fontSize: '18px', marginBottom: '32px', lineHeight: '1.6'}}>
        Click any element to edit it visually
      </p>
      <button style={{padding: '14px 28px', background: '#7c6df0', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontWeight: '600'}}>
        Get Started
      </button>
    </div>
  );
}`

interface EditorShellProps {
  initialCode?: string
  initialId?: string | null
}

export default function EditorShell({ initialCode, initialId }: EditorShellProps) {
  const [jsxCode, setJsxCode] = useState(initialCode ?? DEFAULT_JSX)
  const [copyLabel, setCopyLabel] = useState('Copy JSX')
  const [isRendered, setIsRendered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iframeContent, setIframeContent] = useState('')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [domTree, setDomTree] = useState<DOMTreeNode[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'history'>('properties')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark' | 'mobile'>('light')
  const [componentId, setComponentId] = useState<string | null>(initialId ?? null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === 'ELEMENT_SELECTED') setSelectedElement(e.data)
      if (e.data.type === 'DOM_TREE') setDomTree(e.data.tree)
      if (e.data.type === 'RENDER_ERROR') setError(e.data.message)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Auto-render on mount when loading an existing component
  useEffect(() => {
    if (initialId && initialCode) {
      const html = buildIframeContent(initialCode)
      setIframeContent(html)
      setIsRendered(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClear() {
    setJsxCode('')
    setIframeContent('')
    setIsRendered(false)
    setSelectedElement(null)
    setDomTree([])
    setHistory([])
    setError(null)
    setComponentId(null)
    setSaveStatus('saved')
  }

  async function handleRender() {
    setError(null)
    setSelectedElement(null)
    setDomTree([])
    const html = buildIframeContent(jsxCode)
    setIframeContent(html)
    setIsRendered(true)

    if (!componentId) {
      try {
        setSaveStatus('saving')
        const res = await fetch('/api/component', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: jsxCode }),
        })
        const data = await res.json()
        if (res.ok) {
          setComponentId(data.id)
          setSaveStatus('saved')
        } else {
          setSaveStatus('unsaved')
        }
      } catch {
        setSaveStatus('unsaved')
      }
    }
  }

  function triggerAutoSave(code: string, id: string) {
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving')
        const res = await fetch(`/api/component/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        setSaveStatus(res.ok ? 'saved' : 'unsaved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 1500)
  }

  async function handleSaveNow() {
    if (!componentId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    try {
      setSaveStatus('saving')
      const res = await fetch(`/api/component/${componentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: jsxCode }),
      })
      setSaveStatus(res.ok ? 'saved' : 'unsaved')
    } catch {
      setSaveStatus('unsaved')
    }
  }

  function handleSelectFromLayers(xpath: string) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SELECT_BY_XPATH', xpath }, '*')
  }

  function handleApplyStyle(xpath: string, styles: Record<string, string>, text?: string) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_STYLE', xpath, styles, text }, '*')

    if (Object.keys(styles).length > 0 && selectedElement) {
      const property = Object.keys(styles)[0]
      const value = styles[property]
      const now = new Date()
      const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0')
      setHistory(prev => [
        { tag: selectedElement.tag, property, value, time },
        ...prev,
      ].slice(0, 50))
    }

    if (componentId) {
      triggerAutoSave(jsxCode, componentId)
    }
  }

  function handleCopyJsx() {
    navigator.clipboard.writeText(jsxCode)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy JSX'), 1500)
  }

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: '#0f0f13' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 48, background: '#16161d', borderBottom: '1px solid #2a2a38' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c6df0' }} />
          <span className="text-white text-sm font-medium">VisualEdit</span>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs" style={{ color: '#666677' }}>Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#4ade80' }}>✓ Saved</span>
              {componentId && (
                <span
                  className="text-xs"
                  style={{
                    color: '#444455',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {componentId.slice(0, 8)}
                </span>
              )}
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-xs" style={{ color: '#fbbf24' }}>● Unsaved</span>
          )}
          {componentId && (
            <button
              className="rounded text-xs px-2 py-1"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
              onClick={handleSaveNow}
              disabled={saveStatus === 'saving'}
            >
              Save
            </button>
          )}
          <button
            className="rounded text-xs px-2 py-1"
            style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
            onClick={handleCopyJsx}
          >
            {copyLabel}
          </button>
          <button
            className="rounded text-xs px-2 py-1"
            style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Three-column content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 288, background: '#16161d', borderRight: '1px solid #2a2a38' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid #2a2a38' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#666677' }}>
              Component Code
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#7c6df0', color: '#fff' }}
            >
              JSX
            </span>
          </div>
          <textarea
            className="flex-1 resize-none p-4 outline-none border-0"
            style={{
              background: '#0f0f13',
              color: '#c9d1d9',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
            }}
            placeholder="// Paste your JSX here..."
            value={jsxCode}
            onChange={(e) => setJsxCode(e.target.value)}
          />
          <div
            className="flex gap-2 p-3 shrink-0"
            style={{ borderTop: '1px solid #2a2a38' }}
          >
            <button
              className="flex-1 rounded text-xs py-1.5"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className="flex-1 rounded text-xs py-1.5 font-medium"
              style={{ background: '#7c6df0', color: '#fff', border: 'none' }}
              onClick={handleRender}
            >
              Render
            </button>
          </div>
        </div>

        {/* Center panel */}
        <div className="flex-1 flex flex-col" style={{ background: '#1a1a24' }}>
          <div
            className="flex items-center gap-1 px-3 shrink-0"
            style={{ height: 48, background: '#16161d', borderBottom: '1px solid #2a2a38' }}
          >
            {(['light', 'dark', 'mobile'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className="rounded text-xs px-3 py-1 capitalize"
                style={{
                  border: '1px solid #2a2a38',
                  background: previewMode === mode ? '#7c6df0' : 'transparent',
                  color: previewMode === mode ? '#fff' : '#aaaaaa',
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              className="rounded text-xs px-3 py-1"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
              onClick={handleRender}
            >
              ↻ Refresh
            </button>
          </div>
          {error && (
            <div
              style={{
                background: '#3d1515',
                borderBottom: '1px solid #7f1d1d',
                color: '#fca5a5',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                padding: '8px 12px',
                flexShrink: 0,
              }}
            >
              ⚠ {error}
            </div>
          )}
          <div
            className="flex-1 relative overflow-auto"
            style={{ background: previewMode === 'dark' ? '#1e1e2e' : 'white' }}
          >
            {iframeContent ? (
              <div style={{
                width: previewMode === 'mobile' ? 390 : '100%',
                maxWidth: previewMode === 'mobile' ? 390 : undefined,
                margin: previewMode === 'mobile' ? '0 auto' : undefined,
                height: '100%',
              }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={iframeContent}
                  sandbox="allow-scripts"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm" style={{ color: '#555566' }}>
                  Paste your JSX and click Render
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 288, background: '#16161d', borderLeft: '1px solid #2a2a38' }}
        >
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid #2a2a38' }}
          >
            <span className="text-sm font-medium" style={{ color: '#aaaaaa' }}>Inspector</span>
          </div>
          <div
            className="flex shrink-0"
            style={{ borderBottom: '1px solid #2a2a38' }}
          >
            {(['properties', 'layers', 'history'] as const).map((tab, i, arr) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 text-xs py-2 capitalize"
                style={{
                  color: activeTab === tab ? '#fff' : '#aaaaaa',
                  background: activeTab === tab ? '#0f0f13' : 'transparent',
                  borderRight: i < arr.length - 1 ? '1px solid #2a2a38' : 'none',
                  borderBottom: activeTab === tab ? '2px solid #7c6df0' : '2px solid transparent',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {activeTab === 'properties' && (
            <InspectorPanel
              selectedElement={selectedElement}
              onApplyStyle={handleApplyStyle}
            />
          )}
          {activeTab === 'layers' && (
            <LayersPanel
              tree={domTree}
              selectedXPath={selectedElement?.xpath ?? null}
              onSelectNode={handleSelectFromLayers}
            />
          )}
          {activeTab === 'history' && (
            <HistoryPanel history={history} />
          )}
        </div>
      </div>
    </div>
  )
}
