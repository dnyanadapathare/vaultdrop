const axios = require('axios');

const DEFAULT_CATEGORIES = [
  'Recipes & Food',
  'Travel',
  'Health & Fitness',
  'Self-help & Mindset',
  'Productivity',
  'Career & MBA',
  'Finance & Money',
  'Technology & AI',
  'Science & Nature',
  'Design & Creativity',
  'Politics & Society',
  'History & Culture',
  'Philosophy & Ideas',
  'Relationships',
  'Parenting',
  'Entertainment',
  'Sports',
  'News & Current Affairs',
  'Business & Startups',
  'Other'
];

function getCategories() {
  const custom = process.env.CUSTOM_CATEGORIES
    ? process.env.CUSTOM_CATEGORIES.split(',').map(c => c.trim()).filter(Boolean)
    : [];
  return [...DEFAULT_CATEGORIES, ...custom];
}

async function summarise({ title, text, platform, url, mode = 'summarise' }) {
  const categories = getCategories();

  const truncated = mode === 'full'
    ? (text.length > 24000 ? text.substring(0, 24000) + '...' : text)
    : (text.length > 8000  ? text.substring(0, 8000)  + '...' : text);

  const categoryList = categories.map(c => `- ${c}`).join('\n');

  const systemPromptSummarise = `You are a knowledge extraction assistant. Given raw content from the web, extract and structure it into a JSON object.

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "title": "clean title of the content",
  "category": "exact category name from the list",
  "tags": ["tag1", "tag2", "tag3"],
  "tldr": "one sentence — what this is and why it matters",
  "key_insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "full_notes": "detailed notes covering every important point. preserve specific details, numbers, names, steps, and examples. write as clean prose or bullets. do NOT compress into 3 sentences — cover everything worth knowing."
}

Category must be EXACTLY one of these:
${categoryList}

Rules:
- title: clean and descriptive, max 10 words
- category: exact spelling from the list, single best match
- tags: 3-5 lowercase tags
- tldr: one sentence only
- key_insights: 5-8 bullets, specific and actionable
- full_notes: thorough notes — think of a student who needs to reproduce the key content later. every argument, data point, step, recipe, framework, or example should appear here. minimum 150 words.`;

  const systemPromptFull = `You are a knowledge capture assistant. Given raw content from the web, preserve everything in a structured JSON object. Do NOT summarise or compress anything.

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "title": "clean title of the content",
  "category": "exact category name from the list",
  "tags": ["tag1", "tag2", "tag3"],
  "tldr": "one sentence — what this is and why it matters",
  "key_insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "full_notes": "the COMPLETE content. every step, instruction, ingredient, argument, example, data point, and detail — exactly as it appeared. nothing omitted. preserve numbered lists, bullet points, and structure."
}

Category must be EXACTLY one of these:
${categoryList}

Rules:
- title: clean and descriptive, max 10 words
- category: exact spelling from the list, single best match
- tags: 3-5 lowercase tags
- tldr: one sentence only
- key_insights: 5-8 bullets
- full_notes: verbatim complete content, nothing cut`;

  const userPrompt = `Platform: ${platform}
URL: ${url}
Title hint: ${title || 'unknown'}

Content:
${truncated}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: mode === 'full' ? 4000 : 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: mode === 'full' ? systemPromptFull : systemPromptSummarise },
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);

    // validate category
    if (!categories.includes(parsed.category)) {
      console.log(`[groq] invalid category "${parsed.category}" — falling back to Other`);
      parsed.category = 'Other';
    }

    return parsed;
  } catch (err) {
    console.log('[groq] failed:', err.message);
    return null;
  }
}

module.exports = { summarise, DEFAULT_CATEGORIES };