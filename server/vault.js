const fs = require('fs');
const path = require('path');

function slugify(text) {
  return (text || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .trim();
}

// create category index note in vault root if it doesn't exist
function ensureCategoryIndex(vaultRoot, category) {
  if (!category || !vaultRoot) return;

  const indexPath = path.join(vaultRoot, `${category}.md`);
  if (!fs.existsSync(indexPath)) {
    const content = `# ${category}\n\nIndex note for the **${category}** category. All notes linking here are part of this cluster.\n`;
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`[vault] created category index: ${category}.md`);
  }
}

function buildMarkdown({ title, category, platform, url, tags, tldr, key_insights, full_notes }) {
  const date = new Date().toISOString().split('T')[0];
  const tagList = (tags || []).map(t => `"${t}"`).join(', ');
  const categoryLink = category ? `"[[${category}]]"` : '"[[Other]]"';

  return `---
title: "${title}"
source: "${url}"
platform: ${platform}
saved: ${date}
category: ${categoryLink}
tags: [${tagList}]
---

## TL;DR

${tldr || ''}

## Key Insights

${(key_insights || []).map(i => `- ${i}`).join('\n')}

## Full Notes

${full_notes || ''}
`.trim();
}

async function saveToVault(data) {
  const vaultPath = process.env.VAULT_PATH;

  if (!vaultPath) {
    const markdown = buildMarkdown(data);
    return { saved: false, reason: 'VAULT_PATH not set', markdown };
  }

  // create Inbox folder if it doesn't exist
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
    console.log('[vault] created Inbox folder at', vaultPath);
  }

  // vault root is one level up from Inbox
  const vaultRoot = path.resolve(vaultPath, '..');

  // ensure category index note exists
  if (data.category) {
    ensureCategoryIndex(vaultRoot, data.category);
  }

  const markdown = buildMarkdown(data);

  // clean filename — no timestamps
  const base = slugify(data.title);
  const filename = fs.existsSync(path.join(vaultPath, `${base}.md`))
    ? `${base}-${new Date().toISOString().split('T')[0]}.md`
    : `${base}.md`;

  const filepath = path.join(vaultPath, filename);

  try {
    fs.writeFileSync(filepath, markdown, 'utf8');
    console.log('[vault] saved:', filepath);
    return { saved: true, filename, markdown };
  } catch (err) {
    console.log('[vault] write failed:', err.message);
    return { saved: false, reason: err.message, markdown };
  }
}

module.exports = { saveToVault, buildMarkdown };