const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function extractYTDLP(url) {
  // Step 1: try captions first (no download, fast)
  try {
    const { stdout } = await execAsync(
      `yt-dlp --skip-download --write-auto-subs --sub-format vtt --sub-langs en -o "${path.join(os.tmpdir(), 'vaultdrop_%(id)s')}" "${url}"`,
      { timeout: 30000 }
    );

    // find the vtt file written
    const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('vaultdrop_') && f.endsWith('.vtt'));
    if (tmpFiles.length > 0) {
      const vttPath = path.join(os.tmpdir(), tmpFiles[0]);
      const vttContent = fs.readFileSync(vttPath, 'utf8');
      fs.unlinkSync(vttPath); // clean up

      const cleanText = parseVTT(vttContent);
      if (cleanText.length > 100) {
        console.log('[ytdlp] captions extracted successfully');
        return { method: 'captions', text: cleanText };
      }
    }
  } catch (err) {
    console.log('[ytdlp] captions failed, trying description...');
  }

  // Step 2: try description (metadata only, no download)
  try {
    const { stdout } = await execAsync(
      `yt-dlp --skip-download --print "%(title)s\n%(description)s" "${url}"`,
      { timeout: 20000 }
    );
    if (stdout && stdout.trim().length > 50) {
      console.log('[ytdlp] description extracted successfully');
      return { method: 'description', text: stdout.trim() };
    }
  } catch (err) {
    console.log('[ytdlp] description failed, trying audio...');
  }

  // Step 3: download audio for Sarvam transcription
  const audioPath = path.join(os.tmpdir(), `vaultdrop_audio_${Date.now()}.mp3`);
  try {
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${audioPath}" "${url}"`,
      { timeout: 120000 }
    );
    if (fs.existsSync(audioPath)) {
      console.log('[ytdlp] audio downloaded for transcription');
      return { method: 'audio', audioPath };
    }
  } catch (err) {
    console.log('[ytdlp] audio download failed:', err.message);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }

  return null;
}

function parseVTT(vtt) {
  // strip VTT timestamps and tags, deduplicate lines
  const lines = vtt.split('\n');
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const clean = line
      .replace(/<[^>]+>/g, '')           // remove html tags
      .replace(/\d{2}:\d{2}[\d:.,]+ --> .+/, '') // remove timestamps
      .replace(/^WEBVTT.*/, '')
      .replace(/^NOTE.*/, '')
      .trim();

    if (clean && !seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
    }
  }

  return result.join(' ').replace(/\s+/g, ' ').trim();
}

module.exports = { extractYTDLP };