import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
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

const PLATFORM_ICONS = {
  youtube: '▶',
  instagram: '◈',
  substack: '✦',
  reddit: '◉',
  article: '◎'
}

export default function App() {
  const [url, setUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState(STATES.IDLE)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState(null) // null = auto-detect

  const isProcessing = status === STATES.EXTRACTING || status === STATES.SUMMARISING

  async function handleProcess(e) {
    e?.preventDefault()
    if (!url.trim()) return

    setStatus(STATES.EXTRACTING)
    setResult(null)
    setError('')

    try {
      await new Promise(r => setTimeout(r, 500))
      setStatus(STATES.SUMMARISING)

      const res = await fetch(`${SERVER}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualText: manualText.trim(), mode })
      })

      const data = await res.json()

      if (res.status === 422 && data.needsManual) {
        setStatus(STATES.NEEDS_MANUAL)
        setError(data.error)
        return
      }

      if (!res.ok) {
        setStatus(STATES.ERROR)
        setError(data.error || 'Something went wrong')
        return
      }

      setResult(data)
      setStatus(STATES.DONE)
    } catch {
      setStatus(STATES.ERROR)
      setError('Cannot reach Vaultdrop server. Is it running?')
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

  async function handleCopy() {
    await navigator.clipboard.writeText(result.markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setUrl('')
    setManualText('')
    setStatus(STATES.IDLE)
    setResult(null)
    setError('')
  }

  const platform = result?.structured ? detectPlatform(url) : null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="wordmark">
            <span className="wordmark-icon">⬡</span>
            <span className="wordmark-name">vaultdrop</span>
          </div>
          <p className="wordmark-sub">content → obsidian</p>
        </div>

        <div className="sidebar-body">
          <form onSubmit={handleProcess} className="input-group">
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${mode === null ? 'active' : ''}`}
                onClick={() => setMode(null)}
              >auto</button>
              <button
                type="button"
                className={`mode-btn ${mode === 'summarise' ? 'active' : ''}`}
                onClick={() => setMode('summarise')}
              >summarise</button>
              <button
                type="button"
                className={`mode-btn ${mode === 'full' ? 'active' : ''}`}
                onClick={() => setMode('full')}
              >full capture</button>
            </div>
            <label className="input-label">URL</label>
            <input
              className="url-input"
              type="url"
              placeholder="paste any link..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={isProcessing}
            />

            {status === STATES.NEEDS_MANUAL && (
              <div className="manual-group">
                <label className="input-label">paste content manually</label>
                <textarea
                  className="manual-input"
                  placeholder="paste transcript, article text, or any content..."
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            <button
              className="process-btn"
              type="submit"
              disabled={!url.trim() || isProcessing}
            >
              {isProcessing ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  {status === STATES.EXTRACTING ? 'extracting...' : 'thinking...'}
                </span>
              ) : (
                status === STATES.NEEDS_MANUAL ? 'process manually →' : 'vaultdrop →'
              )}
            </button>
          </form>

          {status === STATES.DONE && result && (
            <div className="meta-panel">
              <div className="meta-row">
                <span className="meta-label">platform</span>
                <span className="meta-value">
                  {PLATFORM_ICONS[platform] || '◎'} {platform}
                </span>
              </div>
              {result.structured?.category && (
  <div className="meta-row">
    <span className="meta-label">category</span>
    <span className="meta-value">⬡ {result.structured.category}</span>
  </div>
)}
              <div className="meta-row">
                <span className="meta-label">tags</span>
                <div className="tags">
                  {result.structured?.tags?.map(t => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
              <div className="meta-row">
                <span className="meta-label">vault</span>
                <span className={`vault-status ${result.savedToVault ? 'ok' : 'miss'}`}>
                  {result.savedToVault ? '✓ saved' : '⚠ download below'}
                </span>
              </div>
            </div>
          )}

          {status === STATES.ERROR && (
            <div className="error-panel">
              <p>{error}</p>
            </div>
          )}
        </div>

        {status === STATES.DONE && result && (
          <div className="sidebar-actions">
            <button className="action-btn primary" onClick={handleDownload}>
              ↓ download .md
            </button>
            <button className="action-btn secondary" onClick={handleCopy}>
              {copied ? '✓ copied' : 'copy markdown'}
            </button>
            <button className="action-btn ghost" onClick={handleReset}>
              + new note
            </button>
          </div>
        )}

        {status === STATES.ERROR && (
          <div className="sidebar-actions">
            <button className="action-btn ghost" onClick={handleReset}>try again</button>
          </div>
        )}
      </aside>

      <main className="preview-pane">
        {status === STATES.IDLE && (
          <div className="empty-state">
            <div className="empty-icon">⬡</div>
            <p className="empty-title">drop a link, get a note</p>
            <p className="empty-sub">YouTube · Instagram · Substack · Reddit · any article</p>
          </div>
        )}

        {isProcessing && (
          <div className="processing-state">
            <div className="processing-orb" />
            <p className="processing-title">
              {status === STATES.EXTRACTING ? 'extracting content' : 'summarising with groq'}
            </p>
            <p className="processing-sub">
              {status === STATES.EXTRACTING ? 'pulling content from the source...' : 'structuring your note...'}
            </p>
          </div>
        )}

        {status === STATES.NEEDS_MANUAL && (
          <div className="empty-state">
            <div className="empty-icon warn">⚠</div>
            <p className="empty-title">extraction failed</p>
            <p className="empty-sub">paste the content manually in the sidebar</p>
          </div>
        )}

        {status === STATES.DONE && result && (
          <div className="markdown-view">
            <div className="markdown-header">
              <h1 className="note-title">{result.structured?.title}</h1>
              <div className="note-meta">
                <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="dot">·</span>
                <span className="note-url">{url}</span>
              </div>
            </div>
            <div className="markdown-body">
              <ReactMarkdown>{stripFrontmatter(result.markdown)}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function stripFrontmatter(markdown) {
  if (!markdown) return ''
  return markdown.replace(/^---[\s\S]*?---\n?/, '').trim()
}

function detectPlatform(url) {
  if (!url) return 'article'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('substack.com') || url.includes('/p/')) return 'substack'
  if (url.includes('reddit.com')) return 'reddit'
  return 'article'
}
