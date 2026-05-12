const axios = require('axios');

async function summarise({ title, text, platform, url, mode = 'summarise' }) {
  const truncated = mode === 'full'
    ? (text.length > 24000 ? text.substring(0, 24000) + '...' : text)
    : (text.length > 8000  ? text.substring(0, 8000)  + '...' : text);

  const systemPromptSummarise = `You are a knowledge extraction assistant. Given raw content from the web, extract and structure it into a JSON object.

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "title": "clean title of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "summary": "2-3 sentence summary of the main content",
  "raw_notes": "any additional useful details, steps, or facts worth keeping"
}

Rules:
- title: clean and descriptive, max 10 words
- tags: 3-5 lowercase tags relevant to the content
- key_insights: 3-5 most actionable or memorable points
- summary: concise, factual, no fluff
- raw_notes: preserve specific details like ingredients, steps, names, numbers`;

  const systemPromptFull = `You are a knowledge capture assistant. Given raw content from the web, preserve the full content in a structured JSON object. Do NOT summarise or shorten — capture everything useful.

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "title": "clean title of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "summary": "1-2 sentence description of what this content is",
  "raw_notes": "the COMPLETE content — all steps, instructions, details, examples, and information. Preserve lists, numbered steps, ingredients, code, and specific details exactly as they appear."
}

Rules:
- title: clean and descriptive, max 10 words
- tags: 3-5 lowercase tags
- key_insights: 3-5 headline takeaways
- summary: brief description only — full content goes in raw_notes
- raw_notes: COMPLETE content, nothing omitted`;

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
        max_tokens: mode === 'full' ? 4000 : 1000,
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
    return JSON.parse(clean);
  } catch (err) {
    console.log('[groq] failed:', err.message);
    return null;
  }
}

module.exports = { summarise };