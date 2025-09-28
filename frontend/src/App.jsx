import React, { useEffect, useMemo, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState(null)
  const [primaryItems, setPrimaryItems] = useState([])
  const [primaryError, setPrimaryError] = useState(null)

  const apiBase = useMemo(() => {
    const defaultBase = '/api'
    const envBase = import.meta.env.VITE_API_BASE || ''
    if (!envBase) return defaultBase
    if (envBase.startsWith('http')) {
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) {
        return defaultBase
      }
    }
    return envBase
  }, [])

  useEffect(() => {
    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
  }, [apiBase])

  useEffect(() => {
    fetch(`${apiBase}/primary`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text()
          throw new Error(text || `HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((data) => {
        setPrimaryItems(data)
        setPrimaryError(null)
      })
      .catch((err) => {
        setPrimaryItems([])
        setPrimaryError(err.message)
      })
  }, [apiBase])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>AI Agents Frontend (Vite)</h1>
      <p>API: {apiBase}</p>
      <section>
        <h2>Health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>
      <section>
        <h2>Primary items</h2>
        {primaryError && <p style={{ color: 'red' }}>Ошибка: {primaryError}</p>}
        <ul>
          {primaryItems.length > 0 ? (
            primaryItems.map((item) => <li key={item.id}>{item.name}</li>)
          ) : (
            <li>Нет данных</li>
          )}
        </ul>
      </section>
    </div>
  )
}
