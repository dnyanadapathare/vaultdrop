require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { extractYTDLP } = require('./extractors/ytdlp');
const { scrapeArticle } = require('./extractors/scraper');
const { transcribeAudio } = require('./sarvam');
const { summarise } = require('./groq');
const { saveToVault, buildMarkdown } = require('./vault');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// detect platform from URL
function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('substack.com') || url.includes('/p/')) return 'substack';
  if (url.includes('reddit.com')) return 'reddit';
  return 'article';
}

// main extraction + summarisation route
app.post('/api/process', async (req, res) => {
  const { url, manualText } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const platform = detectPlatform(url);
  console.log(`\n[vaultdrop] processing ${platform}: ${url}`);

  let extractedText = '';
  let title = '';

  // MANUAL OVERRIDE: user pasted text directly
  if (manualText && manualText.trim().length > 50) {
    console.log('[vaultdrop] using manual text');
    extractedText = manualText.trim();
    title = 'Manual note';
  }

  // VIDEO PLATFORMS: YouTube + Instagram via yt-dlp
  else if (platform === 'youtube' || platform === 'instagram') {
    res.write && null; // keep connection alive hint

    const result = await extractYTDLP(url);

    if (result && result.method === 'audio') {
      // needs Sarvam transcription
      console.log('[vaultdrop] transcribing audio with Sarvam...');
      const transcript = await transcribeAudio(result.audioPath);
      if (transcript) {
        extractedText = transcript;
      }
    } else if (result) {
      extractedText = result.text;
    }

    if (!extractedText) {
      return res.status(422).json({
        error: 'Could not extract content from this video. Please paste the content manually.',
        needsManual: true
      });
    }
  }

  // ARTICLES: Substack, Reddit, generic URLs
  else {
    const result = await scrapeArticle(url);
    if (result) {
      extractedText = result.text;
      title = result.title;
    }

    if (!extractedText) {
      return res.status(422).json({
        error: 'Could not scrape this page. Please paste the content manually.',
        needsManual: true
      });
    }
  }

  // SUMMARISE with Groq
  console.log('[vaultdrop] sending to Groq...');
  const structured = await summarise({ title, text: extractedText, platform, url });

  if (!structured) {
    return res.status(500).json({ error: 'Groq summarisation failed. Try again.' });
  }

  // BUILD markdown
  const markdown = buildMarkdown({ ...structured, platform, url });

  // SAVE to vault
  const vaultResult = await saveToVault({ ...structured, platform, url });

  return res.json({
    success: true,
    markdown,
    filename: vaultResult.filename || null,
    savedToVault: vaultResult.saved,
    vaultError: vaultResult.reason || null,
    structured
  });
});

// health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    vaultPath: process.env.VAULT_PATH || 'not set',
    groq: !!process.env.GROQ_API_KEY,
    sarvam: !!process.env.SARVAM_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`\n⬡ vaultdrop server running on http://localhost:${PORT}`);
  console.log(`  vault → ${process.env.VAULT_PATH || 'NOT SET — will use download fallback'}`);
  console.log(`  groq  → ${process.env.GROQ_API_KEY ? '✓' : '✗ missing'}`);
  console.log(`  sarvam→ ${process.env.SARVAM_API_KEY ? '✓' : '✗ missing'}\n`);
});