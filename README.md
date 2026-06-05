<div align="center">
  <img src="screenshot.png" alt="Vaultdrop UI" width="100%" />
  <br/><br/>
  <h1>⬡ vaultdrop</h1>
  <p><strong>The missing capture layer for your Obsidian second brain.</strong></p>
  <p>Paste any YouTube, Instagram, Substack, or Reddit URL — get a structured markdown note in your Obsidian vault automatically.</p>
  <br/>
  <img src="https://img.shields.io/badge/local--first-yes-7c5cff?style=flat-square" />
  <img src="https://img.shields.io/badge/free-forever-22c55e?style=flat-square" />
  <img src="https://img.shields.io/badge/Indian%20languages-supported-f59e0b?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Sarvam%20AI-saaras%3Av3-f59e0b?style=flat-square" />
  <img src="https://img.shields.io/badge/Groq-Llama%203.3%2070B-7c5cff?style=flat-square" />
</div>

---

## The problem

Most knowledge systems fail at capture. You save a reel, a thread, an article — and it sits in your browser bookmarks, Instagram saved posts, or YouTube watch later. It never makes it into Obsidian. It never becomes a note you can think with.

Capture friction kills PKM habits. If getting something into your vault takes more than 10 seconds, you stop doing it.

Vaultdrop solves the capture layer for video and social content — the piece no other tool handles.

---

## What it does

Paste a URL. Get a structured `.md` note in your Obsidian vault — with frontmatter, category, tags, TL;DR, key insights, and full notes. Automatically.

| Platform | How it works |
|---|---|
| **YouTube Shorts** | Extracts captions → falls back to audio transcription |
| **Instagram Reels** | Downloads audio → transcribes with Sarvam AI |
| **Substack articles** | Scrapes full content → structures with Groq |
| **Reddit threads** | Pulls post + top comments via JSON API |
| **Any article** | Generic scraper for blogs and web pages |
| **Manual paste** | Fallback for anything that can't be extracted |

Every note lands in your `Inbox/` folder with this structure:

```markdown
---
title: "Pigeons Diagnose Cancer"
source: "https://youtube.com/shorts/..."
platform: youtube
saved: 2026-05-13
category: "[[Science & Nature]]"
tags: ["cancer", "pigeons", "ai"]
---

## TL;DR
Pigeons were trained to diagnose breast cancer with 85% accuracy...

## Key Insights
- Pigeons can be trained to diagnose breast cancer with high accuracy
- Combining pigeon votes increases accuracy to 99%
- This challenges the idea that humans are uniquely capable of certain tasks

## Full Notes
A 2015 study trained pigeons to identify breast cancer in pathology slides...
```

---

## Graph view — automatic clustering

Every note links to a category index note via `[[wikilinks]]`. Save 10 recipe reels and they all cluster around a `Recipes & Food` node in your graph automatically.

20 default categories including: Recipes & Food, Travel, Health & Fitness, Technology & AI, Career & MBA, Self-help & Mindset, and more. Add your own via `CUSTOM_CATEGORIES` in `.env`.

---

## Two capture modes

| Mode | Best for | What it does |
|---|---|---|
| **Summarise** | Reels, Shorts, Reddit | Key insights + detailed notes |
| **Full capture** | Articles, Substack, tutorials | Complete content preserved |

Auto-detects the right mode. Override with the toggle anytime.

---

## Indian language support

Vaultdrop uses [Sarvam AI](https://sarvam.ai) `saaras:v3` for audio transcription — built for Hindi, Hinglish, Tamil, Telugu, Kannada, and all Indian languages. A Hindi reel gets transcribed and translated to English automatically. No other PKM capture tool does this.

---

## How I use it

I save around 20-30 pieces of content a week — reels, shorts, threads, articles. Most of it used to disappear into Instagram's saved folder or YouTube watch later, never to be found again.

Now everything lands in my Obsidian Inbox as a structured note. I can search across what I've saved, see connections in graph view, and find that recipe or productivity tip when I actually need it.

The next step I'm building toward: Claude Desktop connected to my vault via MCP. The goal is to ask Claude things like *"what have I saved about productivity this month"* or *"find everything I've captured about travel in Southeast Asia"* and get answers grounded in my actual notes — not hallucinated.

Vaultdrop is the capture layer. Claude is the retrieval layer. The vault becomes a thinking partner instead of a graveyard.

---

## Why local-first

- Your notes are yours — plain `.md` files, forever
- Nothing stored on any server
- Free — you bring your own Groq and Sarvam API keys (both have generous free tiers)
- Works with Obsidian's full ecosystem — graph view, Dataview, Smart Connections, Claude MCP

---

## Prerequisites

Install once:

- [Node.js v18+](https://nodejs.org)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — `winget install yt-dlp` or `brew install yt-dlp`
- [ffmpeg](https://ffmpeg.org) — `winget install ffmpeg` or `brew install ffmpeg`
- [Obsidian](https://obsidian.md) — create a vault first

Free API keys (no credit card):
- [Groq](https://console.groq.com) — AI summarisation
- [Sarvam AI](https://dashboard.sarvam.ai) — audio transcription

---

## Setup

```bash
git clone https://github.com/dnyanadapathare/vaultdrop.git
cd vaultdrop
npm run setup
```

The setup script checks prerequisites, collects your API keys, sets your vault path, and installs everything. Then:

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## Manual setup

Create a `.env` file in the root:

```
GROQ_API_KEY=your_groq_key_here
SARVAM_API_KEY=your_sarvam_key_here
VAULT_PATH=C:\Users\yourname\Documents\ObsidianVault\Inbox
PORT=3001
```

> Mac/Linux: `VAULT_PATH=/Users/yourname/Documents/ObsidianVault/Inbox`

Add custom categories:
```
CUSTOM_CATEGORIES=Spirituality,Legal,Architecture
```

---

## Querying your notes

**Dataview plugin:**
```dataview
TABLE title, platform, saved FROM "Inbox"
WHERE contains(tags, "recipe")
SORT saved DESC
```

**Claude Desktop + MCP:** Connect Claude to your vault and ask *"summarise everything I've saved about productivity this month"*

**Smart Connections plugin:** Semantic search across all notes in natural language.

---

## Project structure

```
vaultdrop/
├── client/               # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       └── App.css
├── server/               # Express local server
│   ├── index.js          # routes + orchestration
│   ├── groq.js           # Groq summarisation
│   ├── sarvam.js         # Sarvam transcription + chunking
│   ├── vault.js          # writes .md to Obsidian
│   └── extractors/
│       ├── ytdlp.js      # YouTube + Instagram
│       └── scraper.js    # articles + Reddit
├── scripts/
│   └── setup.js          # interactive setup wizard
└── .env                  # your keys (never committed)
```

---

## Roadmap

- [ ] Browser extension — vaultdrop any page in one click
- [ ] Batch processing — paste multiple URLs at once
- [ ] Claude MCP setup guide
- [ ] Windows/Mac auto-startup
- [ ] Obsidian plugin

---

## Built by

[Dnyanada Pathare](https://github.com/dnyanadapathare) — product designer, Bangalore.

---

## License

MIT — use it, fork it, build on it.