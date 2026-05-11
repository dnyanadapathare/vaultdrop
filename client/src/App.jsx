import { useState } from 'react'
import './App.css'

const SERVER = 'http://localhost:3001'

const STATES = {
  IDLE: 'idle',
  EXTRACTING: 'extracting',
  SUMMARISING: 'summarising',
  DONE: 'done',
  ERROR: 'error',
  NEEDS_MANUAL: 'needs_manual'
}

const STATUS_MESSAGES = {
  extracting: 'Pulling content...',
  summarising: 'Asking Groq to think...',
  done: 'Your note is ready',
  error: 'Something went wrong',
  needs_manual: 'Extraction failed — paste content below'
}

export default function App() {
  const [url, setUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState(STATES.IDLE)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleProcess(e) {
    e?.preventDefault()
    if (!url.trim()) return

    setStatus(STATES.EXTRACTING)
    setResult(null)
    setError('')

    try {
      // short delay so user sees extracting state
      await new Promise(r => setTimeout(r, 400))
      setStatus(STATES.SUMMARISING)

      const res = await fetch(`${SERVER}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualText: manualText.trim() })
      })

      const data = await res.json()

      if (res.status === 422 && data.needsManual) {
        setStatus(STATES.NEEDS_MANUAL)
        setError(data.error)
        return
      }

      if (!res.ok) {
        setStatus(STATES.ERROR)
        setError(data.error || 'Unknown error')
        return
      }

      setResult(data)
      setStatus(STATES.DONE)
    } catch (err) {
      setStatus(STATES.ERROR)
      setError('Could not reach the Vaultdrop server. Is it running?')
    }
  }

  function handleDownload() {
    if (!result?.markdown) return
    const blob = new Blob([result.markdown], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = result.filename || 'vaultdrop-note.md'
    a.click()
  }

  function handleReset() {
    setUrl('')
    setManualText('')
    setStatus(STATES.IDLE)
    setResult(null)
    setError('')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-hex">⬡</span>
          <span className="logo-text">vaultdrop</span>
        </div>
        <span className="logo-sub">content → obsidian</span>
      </header>

      <main className="main">
        {/* URL INPUT */}
        <form className="input-row" onSubmit={handleProcess}>
          <input
            className="url-input"
            type="url"
            placeholder="paste a YouTube, Instagram, Substack or Reddit URL..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={status === STATES.EXTRACTING || status === STATES.SUMMARISING}
          />
          <button
            className="submit-btn"
            type="submit"
            disabled={!url.trim() || status === STATES.EXTRACTING || status === STATES.SUMMARISING}
          >
            {status === STATES.EXTRACTING || status === STATES.SUMMARISING ? '...' : '→'}
          </button>
        </form>

        {/* STATUS BAR */}
        {status !== STATES.IDLE && (
          <div className={`status-bar status-${status}`}>
            {status === STATES.EXTRACTING || status === STATES.SUMMARISING ? (
              <span className="status-loading">
                <span className="dot-pulse" />
                {STATUS_MESSAGES[status]}
              </span>
            ) : (
              <span>{STATUS_MESSAGES[status] || error}</span>
            )}
          </div>
        )}

        {/* MANUAL PASTE FALLBACK */}
        {status === STATES.NEEDS_MANUAL && (
          <div className="manual-section">
            <p className="manual-hint">{error} Paste the content below and try again.</p>
            <textarea
              className="manual-input"
              placeholder="Paste the article text, transcript, or content here..."
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              rows={8}
            />
            <button
              className="retry-btn"
              onClick={handleProcess}
              disabled={!manualText.trim()}
            >
              Process manual text →
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {status === STATES.ERROR && (
          <div className="error-section">
            <p className="error-msg">{error}</p>
            <button className="reset-btn" onClick={handleReset}>Try again</button>
          </div>
        )}

        {/* RESULT PREVIEW */}
        {status === STATES.DONE && result && (
          <div className="result-section">
            <div className="result-meta">
              <span className="platform-badge">{result.structured?.tags?.join(' · ')}</span>
              {result.savedToVault ? (
                <span className="vault-badge vault-ok">✓ saved to vault</span>
              ) : (
                <span className="vault-badge vault-miss">vault not configured — download below</span>
              )}
            </div>

            <pre className="markdown-preview">{result.markdown}</pre>

            <div className="actions">
              <button className="action-btn primary" onClick={handleDownload}>
                ↓ download .md
              </button>
              <button
                className="action-btn secondary"
                onClick={() => navigator.clipboard.writeText(result.markdown)}
              >
                copy markdown
              </button>
              <button className="action-btn ghost" onClick={handleReset}>
                + new note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}