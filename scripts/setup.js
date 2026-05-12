#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function check(cmd) {
  try { execSync(cmd, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function runInstall(cwd, label) {
  console.log(`\n  installing ${label} dependencies...`);
  try {
    execSync('npm install', { cwd, stdio: 'inherit' });
    ok(`${label} dependencies installed`);
  } catch {
    fail(`${label} npm install failed — try running it manually in ${cwd}`);
  }
}

async function main() {
  console.clear();
  console.log(`\n${BOLD}⬡ vaultdrop setup${RESET}`);
  console.log(`${DIM}  content → obsidian${RESET}\n`);
  console.log('  This will check your prerequisites, collect your API keys,');
  console.log('  set your Obsidian vault path, and install all dependencies.\n');

  const root = path.resolve(__dirname, '..');

  // ── STEP 1: PREREQUISITES ──────────────────────────────────────────────────
  head('step 1 / 4 — checking prerequisites');

  // Node version
  const nodeVer = process.version;
  const nodeMajor = parseInt(nodeVer.slice(1));
  if (nodeMajor >= 18) {
    ok(`Node.js ${nodeVer}`);
  } else {
    fail(`Node.js ${nodeVer} — need v18 or higher. Download at https://nodejs.org`);
    process.exit(1);
  }

  // yt-dlp
  if (check('yt-dlp --version')) {
    ok('yt-dlp found');
  } else {
    warn('yt-dlp not found');
    info('install it: https://github.com/yt-dlp/yt-dlp#installation');
    info('on Windows: winget install yt-dlp');
    info('on Mac: brew install yt-dlp');
    const cont = await ask('\n  continue without yt-dlp? YouTube/Instagram extraction will not work (y/n): ');
    if (cont.toLowerCase() !== 'y') { rl.close(); process.exit(1); }
  }

  // ffmpeg
  if (check('ffmpeg -version')) {
    ok('ffmpeg found');
  } else {
    warn('ffmpeg not found');
    info('install it: https://ffmpeg.org/download.html');
    info('on Windows: winget install ffmpeg');
    info('on Mac: brew install ffmpeg');
    const cont = await ask('\n  continue without ffmpeg? Audio chunking will not work (y/n): ');
    if (cont.toLowerCase() !== 'y') { rl.close(); process.exit(1); }
  }

  // ── STEP 2: API KEYS ───────────────────────────────────────────────────────
  head('step 2 / 4 — api keys');

  console.log(`\n  You need two free API keys:\n`);
  console.log(`  ${BOLD}Groq${RESET} (summarisation) → ${GREEN}https://console.groq.com${RESET}`);
  console.log(`  ${BOLD}Sarvam AI${RESET} (transcription) → ${GREEN}https://dashboard.sarvam.ai${RESET}\n`);

  const groqKey = await ask('  paste your Groq API key: ');
  if (!groqKey.trim()) {
    fail('Groq API key is required');
    rl.close();
    process.exit(1);
  }

  const sarvamKey = await ask('  paste your Sarvam API key: ');
  if (!sarvamKey.trim()) {
    fail('Sarvam API key is required');
    rl.close();
    process.exit(1);
  }

  ok('API keys saved');

  // ── STEP 3: VAULT PATH ─────────────────────────────────────────────────────
  head('step 3 / 4 — obsidian vault');

  console.log('\n  Where is your Obsidian vault?');
  console.log(`  ${DIM}Example: C:\\Users\\yourname\\Documents\\ObsidianVault${RESET}`);
  console.log(`  ${DIM}Example: /Users/yourname/Documents/ObsidianVault${RESET}\n`);

  let vaultPath = await ask('  paste your vault path (or press Enter to use download-only mode): ');
  vaultPath = vaultPath.trim();

  let inboxPath = '';

  if (vaultPath) {
    inboxPath = path.join(vaultPath, 'Inbox');

    if (!fs.existsSync(vaultPath)) {
      warn(`vault path not found: ${vaultPath}`);
      const create = await ask('  create this folder? (y/n): ');
      if (create.toLowerCase() === 'y') {
        fs.mkdirSync(vaultPath, { recursive: true });
        ok(`created ${vaultPath}`);
      } else {
        warn('vault path skipped — will use download mode');
        inboxPath = '';
      }
    }

    if (inboxPath && !fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
      ok(`created Inbox folder at ${inboxPath}`);
    } else if (inboxPath) {
      ok(`Inbox folder found at ${inboxPath}`);
    }
  } else {
    warn('no vault path set — notes will download as .md files');
    info('you can set VAULT_PATH in .env later');
  }

  // ── STEP 4: WRITE .ENV ─────────────────────────────────────────────────────
  head('step 4 / 4 — installing dependencies');

  const envContent = [
    `GROQ_API_KEY=${groqKey.trim()}`,
    `SARVAM_API_KEY=${sarvamKey.trim()}`,
    inboxPath ? `VAULT_PATH=${inboxPath}` : `# VAULT_PATH=path/to/your/ObsidianVault/Inbox`,
    `PORT=3001`,
  ].join('\n');

  fs.writeFileSync(path.join(root, '.env'), envContent);
  ok('.env created');

  // install dependencies
  runInstall(root, 'root');
  runInstall(path.join(root, 'server'), 'server');
  runInstall(path.join(root, 'client'), 'client');

  // ── DONE ───────────────────────────────────────────────────────────────────
  console.log(`\n${GREEN}${BOLD}  ⬡ vaultdrop is ready!${RESET}\n`);
  console.log(`  run it with:\n`);
  console.log(`  ${BOLD}  npm run dev${RESET}\n`);
  console.log(`  then open ${GREEN}http://localhost:5173${RESET} in your browser\n`);

  if (inboxPath) {
    console.log(`  notes will save to: ${DIM}${inboxPath}${RESET}\n`);
  }

  rl.close();
}

main().catch(err => {
  console.error('\n  setup failed:', err.message);
  process.exit(1);
});