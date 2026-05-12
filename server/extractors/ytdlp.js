const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

function findYTDLP() {
  // 1. try PATH first
  try { execSync('yt-dlp --version', { stdio: 'ignore' }); return 'yt-dlp'; } catch {}

  // 2. search WinGet packages folder
  if (os.platform() === 'win32') {
    const packagesDir = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages`;
    try {
      const folders = fs.readdirSync(packagesDir)
        .filter(f => f.toLowerCase().startsWith('yt-dlp'));
      for (const folder of folders) {
        const exe = path.join(packagesDir, folder, 'yt-dlp.exe');
        if (fs.existsSync(exe)) {
          try { execSync(`"${exe}" --version`, { stdio: 'ignore' }); return `"${exe}"`; } catch {}
        }
      }
    } catch {}

    // 3. pip/python locations
    const pipPaths = [
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe`,
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python311\\Scripts\\yt-dlp.exe`,
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python310\\Scripts\\yt-dlp.exe`,
      `${process.env.APPDATA}\\Python\\Python312\\Scripts\\yt-dlp.exe`,
      `${process.env.APPDATA}\\Python\\Python311\\Scripts\\yt-dlp.exe`,
    ];
    for (const p of pipPaths) {
      if (fs.existsSync(p)) {
        try { execSync(`"${p}" --version`, { stdio: 'ignore' }); return `"${p}"`; } catch {}
      }
    }
  }

  // 4. Mac/Linux fallbacks
  for (const p of ['/usr/local/bin/yt-dlp', '/opt/homebrew/bin/yt-dlp', `${process.env.HOME}/.local/bin/yt-dlp`]) {
    try { execSync(`${p} --version`, { stdio: 'ignore' }); return p; } catch {}
  }

  return null;
}

const YTDLP = findYTDLP();
if (YTDLP) console.log(`[ytdlp] found at: ${YTDLP}`);
else console.warn('[ytdlp] yt-dlp not found — video extraction will fail. Install: winget install yt-dlp');

async function extractYTDLP(url) {
  if (!YTDLP) {
    console.log('[ytdlp] yt-dlp not available');
    return null;
  }

  // Step 1: try captions first (no download, fast)
  try {
    const tmpBase = path.join(os.tmpdir(), `vaultdrop_${Date.now()}`);
    await execAsync(
      `${YTDLP} --skip-download --write-auto-subs --sub-format vtt --sub-langs en -o "${tmpBase}" "${url}"`,
      { timeout: 30000 }
    );

    const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f =>
      f.startsWith(path.basename(tmpBase)) && f.endsWith('.vtt')
    );

    if (tmpFiles.length > 0) {
      const vttPath = path.join(os.tmpdir(), tmpFiles[0]);
      const vttContent = fs.readFileSync(vttPath, 'utf8');
      fs.unlinkSync(vttPath);

      const cleanText = parseVTT(vttContent);
      if (cleanText.length > 100) {
        console.log('[ytdlp] captions extracted successfully');
        return { method: 'captions', text: cleanText };
      }
    }
  } catch (err) {
    console.log('[ytdlp] captions failed, trying description...');
  }

  // Step 2: try description
  try {
    const { stdout } = await execAsync(
      `${YTDLP} --skip-download --print "%(title)s\n%(description)s" "${url}"`,
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
      `${YTDLP} -x --audio-format mp3 --audio-quality 5 -o "${audioPath}" "${url}"`,
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
  const lines = vtt.split('\n');
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const clean = line
      .replace(/<[^>]+>/g, '')
      .replace(/\d{2}:\d{2}[\d:.,]+ --> .+/, '')
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