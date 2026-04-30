'use client'

import { useState, useRef, useEffect } from 'react'
import type { SelectedElement } from '@/types/editor'
import InspectorPanel from '@/components/editor/InspectorPanel'

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

export default function EditorPage() {
  const [jsxCode, setJsxCode] = useState(DEFAULT_JSX)
  const [copyLabel, setCopyLabel] = useState('Copy JSX')
  const [isRendered, setIsRendered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iframeContent, setIframeContent] = useState('')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement(e.data)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function handleClear() {
    setJsxCode('')
    setIframeContent('')
    setIsRendered(false)
    setSelectedElement(null)
  }

  function handleRender() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; }
    .ve-hovered { outline: 2px dashed rgba(124, 109, 240, 0.6) !important; outline-offset: 2px; }
    .ve-selected { outline: 2px solid #7c6df0 !important; outline-offset: 2px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${jsxCode}
    const __comp = typeof GeneratedComponent !== 'undefined' ? GeneratedComponent
      : typeof MyComponent !== 'undefined' ? MyComponent
      : typeof App !== 'undefined' ? App
      : typeof Component !== 'undefined' ? Component
      : null;
    if (__comp) {
      ReactDOM.render(React.createElement(__comp), document.getElementById('root'));
    }
  </script>
  <script>
    setTimeout(function() {
      function getXPath(el) {
        if (el === document.body) return '/html/body';
        var ix = 0;
        var siblings = el.parentNode ? el.parentNode.childNodes : [];
        for (var i = 0; i < siblings.length; i++) {
          var sib = siblings[i];
          if (sib === el) return getXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          if (sib.nodeType === 1 && sib.tagName === el.tagName) ix++;
        }
      }

      function getStyles(el) {
        var cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          padding: cs.paddingTop,
          borderRadius: cs.borderRadius,
          textAlign: cs.textAlign,
          width: el.style.width || 'auto',
          borderWidth: cs.borderTopWidth,
          borderColor: cs.borderTopColor
        };
      }

      var TEXT_TAGS = ['h1','h2','h3','h4','h5','h6','p','span','a','button','label','li'];
      var selectedXPath = null;

      document.querySelectorAll('body *').forEach(function(el) {
        el.style.cursor = 'pointer';

        el.addEventListener('mouseover', function(e) {
          e.stopPropagation();
          if (el.classList.contains('ve-selected')) return;
          document.querySelectorAll('.ve-hovered').forEach(function(h) { h.classList.remove('ve-hovered'); });
          el.classList.add('ve-hovered');
        });

        el.addEventListener('mouseout', function(e) {
          e.stopPropagation();
          el.classList.remove('ve-hovered');
        });

        el.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          document.querySelectorAll('.ve-selected').forEach(function(s) { s.classList.remove('ve-selected'); });
          el.classList.remove('ve-hovered');
          el.classList.add('ve-selected');
          var xpath = getXPath(el);
          selectedXPath = xpath;
          var tag = el.tagName.toLowerCase();
          var text = '';
          if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            text = el.textContent.trim();
          }
          window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            tag: tag,
            text: text,
            isTextElement: TEXT_TAGS.includes(tag),
            styles: getStyles(el),
            xpath: xpath
          }, '*');
        });
      });
    }, 800);

    function getElementByXPath(xpath) {
      try {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } catch(e) { return null; }
    }

    window.addEventListener('message', function(e) {
      if (e.data.type === 'APPLY_STYLE') {
        var el = getElementByXPath(e.data.xpath);
        if (!el) return;
        var styles = e.data.styles || {};
        Object.keys(styles).forEach(function(prop) {
          el.style[prop] = styles[prop];
        });
        if (e.data.text !== undefined) {
          var textNodes = Array.from(el.childNodes).filter(function(n) { return n.nodeType === 3; });
          if (textNodes.length > 0) {
            textNodes[0].textContent = e.data.text;
          } else if (el.children.length === 0) {
            el.textContent = e.data.text;
          }
        }
      }
    });
  </script>
</body>
</html>`
    setIframeContent(html)
    setIsRendered(true)
  }

  function handleApplyStyle(xpath: string, styles: Record<string, string>, text?: string) {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'APPLY_STYLE',
      xpath,
      styles,
      text,
    }, '*')
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
        <div className="flex items-center gap-2">
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
            <button
              className="rounded text-xs px-3 py-1"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
            >
              Light
            </button>
            <button
              className="rounded text-xs px-3 py-1"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
            >
              Dark
            </button>
            <button
              className="rounded text-xs px-3 py-1"
              style={{ border: '1px solid #2a2a38', color: '#aaaaaa', background: 'transparent' }}
            >
              Mobile
            </button>
          </div>
          <div className="flex-1 relative">
            {iframeContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={iframeContent}
                sandbox="allow-scripts"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
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
            <button
              className="flex-1 text-xs py-2"
              style={{ color: '#aaaaaa', borderRight: '1px solid #2a2a38', background: 'transparent' }}
            >
              Properties
            </button>
            <button
              className="flex-1 text-xs py-2"
              style={{ color: '#aaaaaa', borderRight: '1px solid #2a2a38', background: 'transparent' }}
            >
              Layers
            </button>
            <button
              className="flex-1 text-xs py-2"
              style={{ color: '#aaaaaa', background: 'transparent' }}
            >
              History
            </button>
          </div>
          <InspectorPanel
            selectedElement={selectedElement}
            onApplyStyle={handleApplyStyle}
          />
        </div>
      </div>
    </div>
  )
}
