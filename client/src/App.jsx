import { useState, useEffect, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import logo from './assets/logo.png'

const SERVER = 'http://localhost:3001'

// ── ICONS ──
const Icons = {
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 4v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M7.5 13.5h6M7.5 16.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  Back: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  Check: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
    </svg>
  ),
  Download: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>
    </svg>
  ),
  Github: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 3 .1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/>
    </svg>
  ),
  Wand: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2M15 10V8M19 6h2M9 6H7M19.5 2.5 18 4M10.5 11.5 12 10"/><path d="m3 21 11-11"/><path d="m12.5 6.5 5 5"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>
    </svg>
  ),
  Doc: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>
    </svg>
  ),
  Vault: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 9V3M12 21v-6M9 12H3M21 12h-6"/>
    </svg>
  ),
}

// ── BACKGROUND ──
function Background() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="orb orb-1" /><span className="orb orb-2" />
        <span className="orb orb-3" /><span className="orb orb-4" />
      </div>
      <div className="bg-grid" aria-hidden="true" />
    </>
  )
}

// ── HEADER ──
function Header({ solid, onHome }) {
  return (
    <header className={`hdr${solid ? ' hdr--solid' : ''}`}>
      <button className="hdr__brand" onClick={onHome}>
        <img src={logo} alt="vaultdrop" style={{ width: 30, height: 30, borderRadius: 8, display: 'block' }} />
        <span className="hdr__name">vaultdrop</span>
        <span className="hdr__beta">beta</span>
      </button>
      <nav className="hdr__nav">
        <a className="hdr__link" href="https://github.com/dnyanadapathare/vaultdrop" target="_blank">Docs</a>
        <a className="hdr__link" href="https://github.com/dnyanadapathare/vaultdrop/releases" target="_blank">Changelog</a>
        <a className="hdr__link hdr__link--icon" href="https://github.com/dnyanadapathare/vaultdrop" target="_blank" aria-label="GitHub"><Icons.Github /></a>
        <a className="hdr__cta" href="https://github.com/dnyanadapathare/vaultdrop" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Star on GitHub ★</a>
      </nav>
    </header>
  )
}

// ── MODE PICKER ──
const MODES = [
  { id: 'auto',      label: 'Auto',      icon: Icons.Wand    },
  { id: 'summarise', label: 'Summarise', icon: Icons.Sparkle },
  { id: 'full',      label: 'Full',      icon: Icons.Doc     },
]

function ModePicker({ mode, setMode }) {
  return (
    <div className="mode">
      {MODES.map(m => (
        <button
          key={m.id}
          type="button"
          className={`mode__btn${mode === m.id ? ' mode__btn--on' : ''}`}
          onClick={() => setMode(m.id)}
        >
          <m.icon /><span className="mode__label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── SAMPLE CHIPS ──
const SAMPLES = [
  { label: 'YouTube Short', url: 'https://www.youtube.com/shorts/-axc4gLn6Hc' },
  { label: 'Substack article', url: 'https://marieclairedean.substack.com/p/i-built-63-design-skills-for-claude' },
  { label: 'Reddit thread', url: 'https://www.reddit.com/r/LocalLLM/comments/1pcmtpt/pipertts_finetuning_a_voice/' },
]

// ── LANDING SCREEN ──
function Landing({ onSubmit }) {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('auto')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function submit(e) {
    e?.preventDefault()
    const u = url.trim()
    if (!u) return
    onSubmit(u.match(/^https?:\/\//) ? u : `https://${u}`, mode)
  }

  return (
    <div className="landing view-enter">
      <Background />
      <Header onHome={() => {}} />
      <main className="landing__main">
        <div className="landing__eyebrow">
          <span className="eyebrow-dot" />
          <span>The capture layer for your Obsidian second brain</span>
        </div>

        <h1 className="landing__title">
          Turn the web into <em>markdown</em><br />
          you actually want to keep.
        </h1>

        <p className="landing__sub">
          Paste any YouTube, Instagram, Substack, or Reddit link.
          Get a structured note in your Obsidian vault — automatically.
        </p>

        <form className="urlbar" onSubmit={submit}>
          <span className="urlbar__icon"><Icons.Link /></span>
          <input
            ref={inputRef}
            className="urlbar__input"
            type="text"
            placeholder="paste a url..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <ModePicker mode={mode} setMode={setMode} />
          <button type="submit" className="urlbar__go" disabled={!url.trim()}>
            Capture <Icons.Arrow />
          </button>
        </form>

        <div className="chips">
          <span className="chips__label">try</span>
          {SAMPLES.map(s => (
            <button key={s.label} className="chip" type="button" onClick={() => setUrl(s.url)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="landing__trust">
          <span><Icons.Check size={11} /> local first</span>
          <span><Icons.Check size={11} /> free forever</span>
          <span><Icons.Check size={11} /> saves as .md</span>
          <span><Icons.Check size={11} /> Indian language support</span>
        </div>
      </main>
      <footer className="landing__foot">
        <span>vaultdrop · made for obsidian</span>
        <span>v1.0 · open source</span>
      </footer>
    </div>
  )
}

// ── MARKDOWN RENDERER ──
function stripFrontmatter(md) {
  if (!md) return ''
  return md.replace(/^---[\s\S]*?---\n?/, '').trim()
}

function MarkdownView({ markdown, isTyping }) {
  const clean = stripFrontmatter(markdown)
  return (
    <div className="md-body">
      <ReactMarkdown>{clean}</ReactMarkdown>
      {isTyping && <span className="md-caret" />}
    </div>
  )
}

// ── SKELETON ──
function Skeleton() {
  return (
    <div className="skel">
      <div className="skel__line skel__line--xl" />
      <div className="skel__line skel__line--md" />
      <div className="skel__gap" />
      <div className="skel__line" />
      <div className="skel__line skel__line--sm" />
      <div className="skel__line" />
      <div className="skel__gap" />
      <div className="skel__line skel__line--md" />
      <div className="skel__line" />
      <div className="skel__line skel__line--sm" />
    </div>
  )
}

// ── CAPTURE SCREEN ──
const STAGE_LABELS = {
  idle: 'ready',
  extracting: 'extracting content…',
  summarising: 'thinking with groq…',
  done: 'captured',
  error: 'failed',
  manual: 'paste content below',
}

const STAGE_PROGRESS = {
  idle: 0, extracting: 30, summarising: 70, done: 100, error: 0, manual: 0,
}

function safeHost(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}
function safePath(u) {
  try { const p = new URL(u); return p.pathname } catch { return '' }
}
function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function detectPlatform(url) {
  if (!url) return 'web'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('substack.com') || url.includes('/p/')) return 'substack'
  if (url.includes('reddit.com')) return 'reddit'
  return 'article'
}
const PLATFORM_INITIALS = { youtube: 'YT', instagram: 'IG', substack: 'SS', reddit: 'RD', article: 'WB' }
const PLATFORM_COLORS = { youtube: '#ff4444', instagram: '#e1306c', substack: '#ff6719', reddit: '#ff4500', article: '#7c5cff' }

function CaptureScreen({ url, initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [stage, setStage] = useState('extracting')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [manualText, setManualText] = useState('')
  const [copied, setCopied] = useState(false)
  const platform = detectPlatform(url)

  useEffect(() => { run(mode) }, [])

  async function run(m) {
    setStage('extracting')
    setResult(null)
    setError('')

    await new Promise(r => setTimeout(r, 500))
    setStage('summarising')

    try {
      const res = await fetch(`${SERVER}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, manualText: manualText.trim(), mode: m })
      })
      const data = await res.json()

      if (res.status === 422 && data.needsManual) {
        setStage('manual')
        setError(data.error)
        return
      }
      if (!res.ok) {
        setStage('error')
        setError(data.error || 'Something went wrong')
        return
      }
      setResult(data)
      setStage('done')
    } catch {
      setStage('error')
      setError('Cannot reach Vaultdrop server. Is it running on port 3001?')
    }
  }

  function handleModeChange(m) {
    setMode(m)
    if (stage === 'done' || stage === 'error') run(m)
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

  const isProcessing = stage === 'extracting' || stage === 'summarising'
  const progress = STAGE_PROGRESS[stage] || 0
  const filename = result?.filename || (result?.structured?.title ? slugify(result.structured.title) + '.md' : 'note.md')

  return (
    <div className="cap view-enter">
      <Background />

      {/* TOP BAR */}
      <div className="cap__bar">
        <button className="cap__back" onClick={onBack} aria-label="Back">
          <Icons.Back />
        </button>
        <div className="cap__urlpill">
          <span
            className="cap__platform-icon"
            style={{ background: PLATFORM_COLORS[platform] }}
          >
            {PLATFORM_INITIALS[platform]}
          </span>
          <span className="cap__host">{safeHost(url)}</span>
          <span className="cap__path">{safePath(url)}</span>
        </div>
        <ModePicker mode={mode} setMode={handleModeChange} />
        <button className="iconbtn iconbtn--ghost" onClick={() => run(mode)} title="Re-run">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>
          </svg>
        </button>
      </div>

      {/* PROGRESS */}
      <div className="cap__progress">
        <div className="cap__progress-fill" style={{ width: `${progress}%` }} />
        <span className="cap__progress-label">{STAGE_LABELS[stage]}</span>
      </div>

      {/* GRID */}
      <div className="cap__grid">

        {/* LEFT — METADATA */}
        <aside className="meta-pane">
          <div className="meta-pane__head">properties</div>

          {isProcessing && (
            <div className="meta-pane__body">
              <div className="meta-empty">
                <div className="pulse-row">
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                </div>
                <p className="meta-empty__text">{STAGE_LABELS[stage]}</p>
              </div>
            </div>
          )}

          {stage === 'manual' && (
            <div className="meta-pane__body">
              <div className="manual-section">
                <p className="manual-hint">{error} Paste the content below and hit capture again.</p>
                <textarea
                  className="manual-textarea"
                  placeholder="paste transcript, article text, or any content..."
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  rows={8}
                />
                <button
                  className="act-btn act-btn--secondary"
                  onClick={() => run(mode)}
                  disabled={!manualText.trim()}
                >
                  Process manually →
                </button>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="meta-pane__body">
              <div className="error-panel">{error}</div>
              <button className="act-btn act-btn--ghost" onClick={() => run(mode)}>Try again</button>
            </div>
          )}

          {stage === 'done' && result && (
            <>
              <div className="meta-pane__body">
                <div className="meta-block">
                  <span className="meta-block__label">platform</span>
                  <span className="meta-block__val meta-block__val--accent">
                    {platform}
                  </span>
                </div>

                {result.structured?.category && (
                  <div className="meta-block">
                    <span className="meta-block__label">category</span>
                    <span className="meta-block__val meta-block__val--accent">
                      {result.structured.category}
                    </span>
                  </div>
                )}

                {result.structured?.tags?.length > 0 && (
                  <div className="meta-block">
                    <span className="meta-block__label">tags</span>
                    <div className="meta-tags">
                      {result.structured.tags.map(t => (
                        <span key={t} className="meta-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="meta-block">
                  <span className="meta-block__label">source</span>
                  <span className="meta-block__val" style={{ fontSize: 11, wordBreak: 'break-all', opacity: .7 }}>
                    {url}
                  </span>
                </div>

                <div className="meta-block">
                  <span className="meta-block__label">saved</span>
                  <span className="meta-block__val">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="meta-divider" />

                <div className="meta-block">
                  <span className="meta-block__label">vault</span>
                  {result.savedToVault
                    ? <span className="vault-ok"><Icons.Check size={11} /> saved to Inbox</span>
                    : <span className="vault-miss">⚠ not configured — download below</span>
                  }
                </div>

                <div className="meta-block">
                  <span className="meta-block__label">mode</span>
                  <span className="meta-block__val">{mode}</span>
                </div>
              </div>

              <div className="meta-pane__foot">
                <button className="act-btn act-btn--primary" onClick={handleDownload}>
                  <Icons.Download /> download .md
                </button>
                <button className="act-btn act-btn--secondary" onClick={handleCopy}>
                  <Icons.Copy /> {copied ? '✓ copied' : 'copy markdown'}
                </button>
                <button className="act-btn act-btn--ghost" onClick={onBack}>
                  + new note
                </button>
              </div>
            </>
          )}
        </aside>

        {/* RIGHT — MARKDOWN */}
        <section className="md-pane">
          <div className="md-pane__head">
            <span className="md-badge">.md</span>
            <span className="md-filename">{filename}</span>
            <span className="md-pane__spacer" />
            {result && (
              <>
                <button className="iconbtn iconbtn--sm" onClick={handleCopy} title="Copy">
                  <Icons.Copy /><span>{copied ? 'copied' : 'copy'}</span>
                </button>
                <button className="iconbtn iconbtn--sm" onClick={handleDownload} title="Download">
                  <Icons.Download /><span>.md</span>
                </button>
              </>
            )}
          </div>

          <div className="md-pane__body">
            {isProcessing && <Skeleton />}
            {!isProcessing && !result && stage !== 'error' && stage !== 'manual' && (
              <div className="notes-empty">
                <div className="pulse-row">
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                </div>
                <p>{STAGE_LABELS[stage]}</p>
              </div>
            )}
            {result && (
              <MarkdownView markdown={result.markdown} isTyping={false} />
            )}
          </div>

          {stage === 'done' && result && (
            <div className="md-pane__foot">
              <span className="md-pane__footstat">
                <Icons.Check size={11} /> captured
              </span>
              <span className="md-pane__footstat">
                {result.markdown?.split(/\s+/).length || 0} words
              </span>
              <span className="md-pane__footstat">
                {result.markdown?.length || 0} chars
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ── ROOT ──
export default function App() {
  const [view, setView] = useState('landing')
  const [target, setTarget] = useState({ url: '', mode: 'auto' })

  function handleSubmit(url, mode) {
    setTarget({ url, mode })
    setView('capture')
  }

  return (
    <>
      {view === 'landing' && (
        <Landing onSubmit={handleSubmit} />
      )}
      {view === 'capture' && (
        <CaptureScreen
          url={target.url}
          initialMode={target.mode}
          onBack={() => setView('landing')}
        />
      )}
    </>
  )
}
