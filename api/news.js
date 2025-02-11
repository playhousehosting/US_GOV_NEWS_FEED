const Parser = require('rss-parser');

// Configure parser with custom User-Agent
const parser = new Parser({
  headers: {
    'User-Agent': 'US-Government-News-Feed/1.0 (https://us-gov-news-feed.vercel.app)'
  },
  timeout: 10000,
  maxRedirects: 5
});

const rssFeeds = [
  'https://www.govinfo.gov/rss/dcpd.xml',
  'https://www.govinfo.gov/rss/pai.xml',
  'https://www.govinfo.gov/rss/plaw.xml',
  'https://www.govinfo.gov/rss/comps.xml'
];

const feedCategories = {
  'dcpd': 'Presidential Communications',
  'pai': 'Public and Private Laws',
  'plaw': 'Public Laws',
  'comps': 'Federal Regulations'
};

// Helper function to handle errors
const handleError = (error) => {
  console.error('Error:', error);
  return {
    error: true,
    message: error.message || 'An error occurred while fetching the feeds',
    status: error.response?.status || 500
  };
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Fetch all feeds concurrently with timeout
    const feedPromises = rssFeeds.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        const category = url.match(/\/rss\/([^.]+)\.xml$/)[1];
        return {
          items: feed.items,
          category: feedCategories[category] || category
        };
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return { items: [], category: '' };
      }
    });

    const feedData = await Promise.all(feedPromises);

    // Process and format articles
    const articles = feedData
      .flatMap(({ items, category }) => 
        items.map(item => ({
          title: item.title,
          link: item.link,
          content: item.contentSnippet || item.content || '',
          pubDate: item.pubDate,
          image: item.enclosure ? item.enclosure.url : null,
          category: category
        }))
      )
      .filter(article => article.title && article.link);

    // Sort articles by date, most recent first
    articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Send response
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(articles);
  } catch (error) {
    const { message, status } = handleError(error);
    res.status(status).json({ error: true, message });
  }
};