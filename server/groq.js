const axios = require('axios');

async function summarise({ title, text, platform, url }) {
  const truncated = text.length > 8000 ? text.substring(0, 8000) + '...' : text;

  const systemPrompt = `You are a knowledge extraction assistant. Given raw content from the web, extract and structure it into a JSON object.

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
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const raw = response.data.choices[0].message.content.trim();

    // strip markdown fences if Groq wraps in ```json
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.log('[groq] failed:', err.message);
    return null;
  }
}

module.exports = { summarise };