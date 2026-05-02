'use client'

import { useState, useRef, useEffect } from 'react'
import type { SelectedElement, DOMTreeNode, HistoryEntry } from '@/types/editor'
import InspectorPanel from '@/components/editor/InspectorPanel'
import LayersPanel from '@/components/editor/LayersPanel'
import HistoryPanel from '@/components/editor/HistoryPanel'
import { buildIframeContent } from '@/lib/buildIframeContent'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Copy, RotateCcw, CheckCircle2, Circle, Loader2, X, Play, Monitor, Tablet, Smartphone, RefreshCw, FileCode2, AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center px-4 gap-4 shrink-0 bg-background border-b" style={{ height: 44 }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center bg-zinc-900 text-white rounded text-[10px] font-bold" style={{ width: 24, height: 24 }}>
            VE
          </div>
          <span className="text-[13px] font-medium tracking-tight">VisualEditor</span>
          <Separator orientation="vertical" className="h-5" />
          <div className={`text-[10px] font-mono rounded-full px-2 py-0.5 bg-zinc-100 text-zinc-500 border-0`}>
            {componentId ? componentId.slice(0, 8) : 'Unsaved'}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Saved
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Circle className="h-3 w-3 text-amber-500" />
              Unsaved
            </span>
          )}
          {componentId && (
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleSaveNow} disabled={saveStatus === 'saving'}>
              Save
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleCopyJsx}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            {copyLabel}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleClear}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Three-column content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col shrink-0 bg-zinc-50 border-r" style={{ width: 320 }}>
          <div className="flex items-center justify-between px-4 shrink-0 border-b" style={{ height: 36 }}>
            <span className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase">Component</span>
            <span className="text-[10px] font-mono text-zinc-400">JSX</span>
          </div>
          <Textarea
            className="flex-1 resize-none border-0 bg-zinc-50 font-mono text-[12px] leading-[1.7] focus-visible:ring-0 rounded-none p-4 text-zinc-800"
            placeholder="Paste your React component here..."
            value={jsxCode}
            onChange={(e) => setJsxCode(e.target.value)}
          />
          <div className="flex items-center gap-2 px-3 shrink-0 border-t bg-white" style={{ height: 44 }}>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900" onClick={handleClear}>
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
            <Button size="sm" className="ml-auto bg-zinc-900 hover:bg-zinc-700 text-white" onClick={handleRender}>
              <Play className="h-3.5 w-3.5 mr-1" />
              Render
            </Button>
          </div>
        </div>

        {/* Center panel */}
        <div className="flex-1 flex flex-col">
          {/* Preview toolbar */}
          <div className="flex items-center gap-2 px-2 shrink-0 bg-white border-b border-zinc-100" style={{ height: 36 }}>
            <Button
              variant={previewMode === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 text-[11px] gap-1${previewMode !== 'light' ? ' text-zinc-400' : ''}`}
              onClick={() => setPreviewMode('light')}
            >
              <Monitor className="h-3.5 w-3.5 mr-1" />
              Desktop
            </Button>
            <Button
              variant={previewMode === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 text-[11px] gap-1${previewMode !== 'dark' ? ' text-zinc-400' : ''}`}
              onClick={() => setPreviewMode('dark')}
            >
              <Tablet className="h-3.5 w-3.5 mr-1" />
              Tablet
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 text-[11px] gap-1${previewMode !== 'mobile' ? ' text-zinc-400' : ''}`}
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-3.5 w-3.5 mr-1" />
              Mobile
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={handleRender}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Re-render</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-2 bg-red-50 border-b border-red-200 shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs text-red-700 font-mono">{error}</span>
            </div>
          )}

          {/* Preview area */}
          {iframeContent ? (
            <div
              className="flex-1 overflow-auto"
              style={{
                backgroundImage: 'radial-gradient(circle, #e4e4e7 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#f9fafb',
              }}
            >
              {previewMode === 'mobile' ? (
                <div className="min-h-full flex items-start justify-center py-10">
                  {/* Phone shell */}
                  <div
                    className="relative shrink-0 bg-zinc-900 rounded-[44px] shadow-2xl ring-1 ring-zinc-800"
                    style={{ width: 418, paddingTop: 16, paddingBottom: 10, paddingLeft: 14, paddingRight: 14 }}
                  >
                    {/* Volume down / silent toggle */}
                    <div className="absolute rounded-l-full bg-zinc-700" style={{ left: -3, top: 112, width: 3, height: 30 }} />
                    <div className="absolute rounded-l-full bg-zinc-700" style={{ left: -3, top: 160, width: 3, height: 56 }} />
                    <div className="absolute rounded-l-full bg-zinc-700" style={{ left: -3, top: 228, width: 3, height: 56 }} />
                    {/* Power button */}
                    <div className="absolute rounded-r-full bg-zinc-700" style={{ right: -3, top: 176, width: 3, height: 80 }} />

                    {/* Dynamic Island */}
                    <div
                      className="absolute bg-zinc-900 rounded-full z-10"
                      style={{ top: 26, left: '50%', transform: 'translateX(-50%)', width: 120, height: 34 }}
                    />

                    {/* Screen */}
                    <div className="overflow-hidden rounded-[32px] bg-white" style={{ height: 812 }}>
                      <iframe
                        ref={iframeRef}
                        srcDoc={iframeContent}
                        sandbox="allow-scripts"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                      />
                    </div>

                    {/* Home indicator */}
                    <div className="flex justify-center pt-2.5 pb-0.5">
                      <div className="rounded-full bg-zinc-600" style={{ width: 134, height: 4 }} />
                    </div>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={iframeContent}
                  sandbox="allow-scripts"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              )}
            </div>
          ) : (
            <div
              className="flex-1 flex items-center justify-center"
              style={{
                backgroundImage: 'radial-gradient(circle, #e4e4e7 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#f9fafb',
              }}
            >
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-12 py-16 text-center">
                <FileCode2 className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-500">Paste your component</p>
                <p className="text-xs text-zinc-400 mt-1">and click Render to preview it</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col shrink-0 bg-white border-l border-zinc-100" style={{ width: 288 }}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none border-b bg-transparent h-10 p-0 shrink-0">
              {(['properties', 'layers', 'history'] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-medium h-10 capitalize text-zinc-500 data-[state=active]:text-zinc-900"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="properties" className="flex-1 mt-0 overflow-hidden">
              <InspectorPanel
                selectedElement={selectedElement}
                onApplyStyle={handleApplyStyle}
              />
            </TabsContent>
            <TabsContent value="layers" className="flex-1 mt-0 overflow-hidden">
              <LayersPanel
                tree={domTree}
                selectedXPath={selectedElement?.xpath ?? null}
                onSelectNode={handleSelectFromLayers}
              />
            </TabsContent>
            <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
              <HistoryPanel history={history} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
