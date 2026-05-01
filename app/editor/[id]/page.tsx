'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import EditorShell from '@/components/editor/EditorShell'

interface ComponentData {
  id: string
  code: string
}

export default function EditorIdPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ComponentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/component/${id}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null }
        return res.json()
      })
      .then((d: ComponentData | null) => {
        if (d) { setData(d); setLoading(false) }
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) {
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
        Loading...
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          height: '100vh',
          background: '#0f0f13',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span style={{ color: '#555566', fontSize: 14 }}>Component not found</span>
        <Link
          href="/editor"
          style={{ fontSize: 12, color: '#7c6df0', textDecoration: 'none' }}
        >
          ← New editor
        </Link>
      </div>
    )
  }

  return <EditorShell initialCode={data.code} initialId={data.id} />
}
