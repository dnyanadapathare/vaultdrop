#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function ok(msg)   { console.log(`${GREEN}  ✓${RESET} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}  ⚠${RESET} ${msg}`); }
function fail(msg) { console.log(`${RED}  ✗${RESET} ${msg}`); }
function info(msg) { console.log(`${DIM}    ${msg}${RESET}`); }
function head(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

const isWindows = os.platform() === 'win32';
const isMac     = os.platform() === 'darwin';

// check command across common install locations, not just PATH
function checkTool(name) {
  // first try PATH
  try { execSync(`${name} --version`, { stdio: 'ignore' }); return true; } catch {}

  // check common install locations
  const locations = isWindows
    ? [
        `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python3*\\Scripts\\${name}.exe`,
        `${process.env.USERPROFILE}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\**\\${name}.exe`,
        `C:\\ProgramData\\chocolatey\\bin\\${name}.exe`,
        `C:\\tools\\${name}.exe`,
      ]
    : [
        `/usr/local/bin/${name}`,
        `/opt/homebrew/bin/${name}`,
        `/usr/bin/${name}`,
      ];

  for (const loc of locations) {
    try {
      // use glob-free direct paths
      if (fs.existsSync(loc)) return true;
    } catch {}
  }

  // on Windows, try winget list as last resort
  if (isWindows && name === 'yt-dlp') {
    try {
      const result = execSync('winget list yt-dlp', { stdio: 'pipe' }).toString();
      if (result.includes('yt-dlp')) return true;
    } catch {}
  }

  return false;
}

async function installTool(name) {
  console.log(`\n  ${BOLD}Installing ${name}...${RESET}`);

  if (isWindows) {
    // try winget first
    try {
      execSync(`winget install ${name}`, { stdio: 'inherit' });
      ok(`${name} installed via winget`);
      return true;
    } catch {}

    // fallback to pip for yt-dlp
    if (name === 'yt-dlp') {
      try {
        execSync('pip install yt-dlp', { stdio: 'inherit' });
        ok('yt-dlp installed via pip');
        return true;
      } catch {}
    }

    // fallback for ffmpeg
    if (name === 'ffmpeg') {
      try {
        execSync('winget install ffmpeg', { stdio: 'inherit' });
        ok('ffmpeg installed via winget');
        return true;
      } catch {}
    }
  }

  if (isMac) {
    try {
      execSync(`brew install ${name}`, { stdio: 'inherit' });
      ok(`${name} installed via brew`);
      return true;
    } catch {}
  }

  return false;
}

// refresh PATH by re-reading common locations
function refreshPath() {
  const extraPaths = isWindows
    ? [
        `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Python\\Python3*\\Scripts`,
        `${process.env.USERPROFILE}\\.local\\bin`,
        `C:\\ProgramData\\chocolatey\\bin`,
        `${process.env.USERPROFILE}\\AppData\\Local\\Microsoft\\WinGet\\Links`,
      ]
    : [
        '/usr/local/bin',
        '/opt/homebrew/bin',
        `${process.env.HOME}/.local/bin`,
      ];

  process.env.PATH = [process.env.PATH, ...extraPaths].join(isWindows ? ';' : ':');
}

async function checkAndInstall(name, label) {
  refreshPath();

  if (checkTool(name)) {
    ok(`${label} found`);
    return true;
  }

  warn(`${label} not found`);
  const install = await ask(`  install ${label} automatically? (y/n): `);

  if (install.toLowerCase() === 'y') {
    const success = await installTool(name);
    if (success) {
      refreshPath();
      // verify after install
      if (checkTool(name)) {
        ok(`${label} verified after install`);
        return true;
      } else {
        warn(`${label} installed but not detected in PATH yet`);
        info('This is a PATH refresh issue. Close this terminal, open a new one, and run npm run setup again.');
        info(`Manual install guide: ${name === 'yt-dlp'
          ? 'https://github.com/yt-dlp/yt-dlp#installation'
          : 'https://ffmpeg.org/download.html'}`);
        const cont = await ask('  continue anyway? (y/n): ');
        return cont.toLowerCase() === 'y';
      }
    } else {
      warn(`automatic install failed — install ${label} manually`);
      info(`${name === 'yt-dlp'
        ? 'Windows: winget install yt-dlp  |  Mac: brew install yt-dlp'
        : 'Windows: winget install ffmpeg  |  Mac: brew install ffmpeg'}`);
      const cont = await ask('  continue without it? (y/n): ');
      return cont.toLowerCase() === 'y';
    }
  } else {
    info(`${name === 'yt-dlp'
      ? 'Windows: winget install yt-dlp  |  Mac: brew install yt-dlp'
      : 'Windows: winget install ffmpeg  |  Mac: brew install ffmpeg'}`);
    const cont = await ask('  continue without it? (y/n): ');
    return cont.toLowerCase() === 'y';
  }
}

function runInstall(cwd, label) {
  console.log(`\n  installing ${label} dependencies...`);
  try {
    execSync('npm install', { cwd, stdio: 'inherit' });
    ok(`${label} ready`);
  } catch {
    fail(`${label} npm install failed — run it manually in ${cwd}`);
  }
}

async function main() {
  console.clear();
  console.log(`\n${BOLD}⬡ vaultdrop setup${RESET}`);
  console.log(`${DIM}  content → obsidian${RESET}\n`);
  console.log('  This will check prerequisites, collect API keys,');
  console.log('  configure your Obsidian vault, and install dependencies.\n');

  const root = path.resolve(__dirname, '..');

  // ── STEP 1: PREREQUISITES ──────────────────────────────────────────────────
  head('step 1 / 4 — prerequisites');

  // Node version
  const nodeMajor = parseInt(process.version.slice(1));
  if (nodeMajor >= 18) {
    ok(`Node.js ${process.version}`);
  } else {
    fail(`Node.js ${process.version} — need v18+. Download: https://nodejs.org`);
    rl.close(); process.exit(1);
  }

  // yt-dlp
  await checkAndInstall('yt-dlp', 'yt-dlp');

  // ffmpeg
  await checkAndInstall('ffmpeg', 'ffmpeg');

  // ── STEP 2: API KEYS ───────────────────────────────────────────────────────
  head('step 2 / 4 — api keys');

  console.log(`\n  You need two free API keys:\n`);
  console.log(`  ${BOLD}Groq${RESET} (AI summarisation)\n  → ${GREEN}https://console.groq.com${RESET}`);
  console.log(`\n  ${BOLD}Sarvam AI${RESET} (audio transcription, Indian languages)\n  → ${GREEN}https://dashboard.sarvam.ai${RESET}\n`);

  const groqKey = await ask('  Groq API key: ');
  if (!groqKey.trim()) { fail('Groq key required'); rl.close(); process.exit(1); }

  const sarvamKey = await ask('  Sarvam API key: ');
  if (!sarvamKey.trim()) { fail('Sarvam key required'); rl.close(); process.exit(1); }

  ok('API keys saved');

  // ── STEP 3: VAULT PATH ─────────────────────────────────────────────────────
  head('step 3 / 4 — obsidian vault');

  console.log('\n  Where is your Obsidian vault?');
  if (isWindows) info('Example: C:\\Users\\yourname\\Documents\\ObsidianVault');
  else           info('Example: /Users/yourname/Documents/ObsidianVault');
  console.log();

  let vaultPath = (await ask('  vault path (Enter to skip → download-only mode): ')).trim();
  let inboxPath = '';

  if (vaultPath) {
    inboxPath = path.join(vaultPath, 'Inbox');

    if (!fs.existsSync(vaultPath)) {
      warn(`path not found: ${vaultPath}`);
      const create = await ask('  create this folder? (y/n): ');
      if (create.toLowerCase() === 'y') {
        fs.mkdirSync(vaultPath, { recursive: true });
        ok(`created ${vaultPath}`);
      } else {
        warn('vault path skipped — download mode only');
        inboxPath = '';
      }
    }

    if (inboxPath && !fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
      ok(`Inbox folder created at ${inboxPath}`);
    } else if (inboxPath) {
      ok(`Inbox folder found`);
    }
  } else {
    warn('no vault path — notes will download as .md files');
    info('set VAULT_PATH in .env later to enable auto-save');
  }

  // ── STEP 4: WRITE .ENV + INSTALL ──────────────────────────────────────────
  head('step 4 / 4 — installing dependencies');

  const envLines = [
    `GROQ_API_KEY=${groqKey.trim()}`,
    `SARVAM_API_KEY=${sarvamKey.trim()}`,
    inboxPath
      ? `VAULT_PATH=${inboxPath}`
      : `# VAULT_PATH=path/to/ObsidianVault/Inbox`,
    `PORT=3001`,
  ];

  fs.writeFileSync(path.join(root, '.env'), envLines.join('\n'));
  ok('.env created');

  runInstall(root,                        'root');
  runInstall(path.join(root, 'server'),   'server');
  runInstall(path.join(root, 'client'),   'client');

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log(`\n${GREEN}${BOLD}  ⬡ vaultdrop is ready!${RESET}\n`);
  console.log(`  start it:\n\n  ${BOLD}  npm run dev${RESET}\n`);
  console.log(`  then open ${GREEN}http://localhost:5173${RESET}\n`);
  if (inboxPath) info(`notes → ${inboxPath}`);
  console.log();

  rl.close();
}

main().catch(err => {
  console.error('\n  setup failed:', err.message);
  rl.close();
  process.exit(1);
});