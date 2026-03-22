'use client'

export default function AdminError({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', color: '#ef4444' }}>
      <strong>Admin Error:</strong>
      <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 13 }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
    </div>
  )
}
