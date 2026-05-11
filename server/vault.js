const fs = require('fs');
const path = require('path');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .trim();
}

function buildMarkdown({ title, platform, url, tags, key_insights, summary, raw_notes }) {
  const date = new Date().toISOString().split('T')[0];
  const tagList = (tags || []).map(t => `"${t}"`).join(', ');

  return `---
title: "${title}"
source: "${url}"
platform: ${platform}
saved: ${date}
tags: [${tagList}]
---

## Key Insights

${(key_insights || []).map(i => `- ${i}`).join('\n')}

## Summary

${summary || ''}

## Raw Notes

${raw_notes || ''}
`.trim();
}

async function saveToVault(data) {
  const vaultPath = process.env.VAULT_PATH;

  if (!vaultPath) {
    return { saved: false, reason: 'VAULT_PATH not set' };
  }

  // create Inbox folder if it doesn't exist
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
    console.log('[vault] created Inbox folder at', vaultPath);
  }

  const markdown = buildMarkdown(data);
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