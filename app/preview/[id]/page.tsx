import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { buildIframeContent } from '@/lib/buildIframeContent'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PreviewPage({ params }: Props) {
  const { id } = await params

  const { data, error } = await supabase
    .from('components')
    .select('id, code')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f0f13',
          color: '#555566',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        Component not found
      </div>
    )
  }

  const iframeContent = buildIframeContent(data.code)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f13' }}>
      {/* Top bar */}
      <div
        style={{
          height: 48,
          background: '#16161d',
          borderBottom: '1px solid #2a2a38',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c6df0' }} />
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>VisualEdit</span>
        </div>
        <Link
          href={`/editor/${id}`}
          style={{
            fontSize: 12,
            color: '#aaaaaa',
            border: '1px solid #2a2a38',
            borderRadius: 4,
            padding: '4px 10px',
            textDecoration: 'none',
          }}
        >
          Open in Editor
        </Link>
      </div>

      {/* Preview */}
      <iframe
        srcDoc={iframeContent}
        sandbox="allow-scripts"
        style={{ flex: 1, border: 'none', width: '100%' }}
      />
    </div>
  )
}
