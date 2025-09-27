import React, { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState(null)
  const apiBase = import.meta.env.VITE_API_BASE || '/api'

  useEffect(() => {
    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
  }, [apiBase])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>AI Agents Frontend (Vite)</h1>
      <p>API: {apiBase}</p>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <div style={{ color: 'red' }}>КРАСНЫЙ</div>
    </div>
  )
}
