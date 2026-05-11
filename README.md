# ⬡ vaultdrop

> Paste any URL. Get a structured markdown note in your Obsidian vault.

![Vaultdrop UI](screenshot.png)

Vaultdrop is a local-first content-to-knowledge pipeline for Obsidian users. Paste a YouTube, Instagram, Substack, or Reddit URL — it extracts the content, transcribes audio if needed, summarises it with AI, and saves a clean `.md` file directly into your Obsidian vault.

No cloud storage. No accounts. No subscription. Everything stays on your machine.

---

## what it does

- **YouTube Shorts** — extracts captions, falls back to audio transcription
- **Instagram Reels** — downloads audio, transcribes with Sarvam AI (supports Hindi, Hinglish, and all Indian languages)
- **Substack articles** — scrapes and summarises full content
- **Reddit threads** — pulls post + top comments via Reddit JSON API
- **Any article** — generic scraper for blogs and web pages
- **Manual paste** — fallback for anything that can't be extracted automatically

Every note is saved as structured markdown with frontmatter Obsidian understands:

```markdown
---
title: "Pigeons Diagnose Cancer"
source: "https://youtube.com/shorts/..."
platform: youtube
saved: 2026-05-11
tags: ["artificial intelligence", "cancer diagnosis", "pigeon study"]
---

## Key Insights
- Pigeons can be trained to diagnose breast cancer
- Combining pigeon votes increases accuracy to 99%

## Summary
A study in 2015 trained pigeons to diagnose breast cancer from pathology slides...

## Raw Notes
...
```

---

## stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express (local) |
| Video extraction | yt-dlp |
| Audio transcription | Sarvam AI `saaras:v3` |
| Summarisation | Groq `llama-3.3-70b-versatile` |
| Article scraping | Cheerio |
| Output | Markdown → Obsidian vault |

---

## prerequisites

Install these before setup:

- [Node.js v18+](https://nodejs.org)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — add to PATH
- [ffmpeg](https://ffmpeg.org) — add to PATH
- [Obsidian](https://obsidian.md) — create a vault first

Free API keys (no credit card needed):
- [Groq](https://console.groq.com) — for summarisation
- [Sarvam AI](https://dashboard.sarvam.ai) — for audio transcription

---

## setup

**1. Clone the repo**
```bash
git clone https://github.com/dnyanadapathare/vaultdrop.git
cd vaultdrop
```

**2. Install dependencies**
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

**3. Create your `.env` file in the root folder**
```
GROQ_API_KEY=your_groq_key_here
SARVAM_API_KEY=your_sarvam_key_here
VAULT_PATH=C:\Users\yourname\Documents\ObsidianVault\Inbox
PORT=3001
```

> On Mac/Linux: `VAULT_PATH=/Users/yourname/Documents/ObsidianVault/Inbox`

**4. Create the Inbox folder in your vault**
```bash
mkdir "path/to/your/ObsidianVault/Inbox"
```

**5. Run**
```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## how it works

```
URL
 │
 ├── YouTube / Instagram
 │    └── yt-dlp → captions → description → audio → Sarvam transcription
 │
 ├── Substack / Reddit / Articles
 │    └── Express fetch → Cheerio parse
 │
 └── Manual paste (fallback)
      │
      └── Groq Llama 3.3 70B → structured JSON → markdown → Obsidian Inbox
```

---

## querying your notes

Since notes land in Obsidian with clean frontmatter, you can query them with:

- **Obsidian search** (`Ctrl+Shift+F`) — search by keyword, tag, or platform
- **Dataview plugin** — SQL-like queries across all notes
- **Smart Connections plugin** — natural language semantic search
- **Claude Desktop + MCP** — chat with your entire vault using Claude

Example Dataview query:
```dataview
TABLE title, platform, saved FROM "Inbox"
WHERE contains(tags, "recipe")
SORT saved DESC
```

---

## project structure

```
vaultdrop/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       └── App.css
├── server/                  # Express backend
│   ├── index.js             # routes + orchestration
│   ├── groq.js              # Groq summarisation
│   ├── sarvam.js            # Sarvam transcription + chunking
│   ├── vault.js             # writes .md to Obsidian
│   └── extractors/
│       ├── ytdlp.js         # YouTube + Instagram extraction
│       └── scraper.js       # article scraping
├── .env                     # your keys (never committed)
└── package.json
```

---

## why local-first

Most content-saving tools store your data in their cloud. Vaultdrop runs entirely on your machine:

- Your notes are yours — plain `.md` files, forever
- Works offline after initial extraction
- No monthly subscription
- Obsidian's full graph view, backlinks, and plugins work on your notes
- You query with your own Claude/AI setup

---

## roadmap

- [ ] Browser extension — vaultdrop any page in one click
- [ ] Batch processing — paste multiple URLs at once
- [ ] Tag editor — edit tags before saving
- [ ] Claude MCP setup guide — query your vault with Claude Desktop
- [ ] Windows auto-startup script

---

## built by

[Dnyanada Pathare](https://github.com/dnyanadapathare) — product designer, Bangalore

---

## license

MIT — use it, fork it, build on it.