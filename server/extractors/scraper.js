const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeArticle(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);

    // remove noise
    $('script, style, nav, footer, header, aside, .comments, #comments, .sidebar').remove();

    let title = $('h1').first().text().trim() ||
                $('title').text().trim() ||
                'Untitled';

    let text = '';

    // platform-specific selectors
    if (url.includes('substack.com') || url.includes('/p/')) {
      text = $('.body, .post-content, article').text();
    } else if (url.includes('reddit.com')) {
  // use Reddit's JSON API instead of scraping HTML
  const jsonUrl = url.replace(/\/$/, '') + '.json';
  const { data: redditData } = await axios.get(jsonUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'vaultdrop/1.0',
      'Accept': 'application/json'
    }
  });
  const post = redditData[0]?.data?.children[0]?.data;
  title = post?.title || 'Reddit post';
  const selftext = post?.selftext || '';
  const comments = redditData[1]?.data?.children
    ?.slice(0, 5)
    ?.map(c => c?.data?.body)
    ?.filter(Boolean)
    ?.join('\n\n') || '';
  text = `${title}\n\n${selftext}\n\nTop comments:\n${comments}`;
  return { title, text: text.trim() };
    } else {
      // generic: grab article or main content
      text = $('article, main, .content, .post-body, .entry-content').text();
    }

    // fallback to body if nothing found
    if (!text || text.trim().length < 100) {
      text = $('body').text();
    }

    // clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // truncate to 8000 chars to stay within Groq token limits
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '...';
    }

    return { title, text };
  } catch (err) {
    console.log('[scraper] failed:', err.message);
    return null;
  }
}

module.exports = { scrapeArticle };