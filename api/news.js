const Parser = require('rss-parser');
const parser = new Parser();

const rssFeeds = [
  'https://www.govinfo.gov/rss/dcpd.xml',
  'https://www.govinfo.gov/rss/pai.xml',
  'https://www.govinfo.gov/rss/plaw.xml',
  'https://www.govinfo.gov/rss/comps.xml'
];

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const feedData = await Promise.all(rssFeeds.map(url => parser.parseURL(url)));
    const articles = feedData.flatMap(feed => feed.items.map(item => ({
      title: item.title,
      link: item.link,
      content: item.contentSnippet,
      pubDate: item.pubDate,
      image: item.enclosure ? item.enclosure.url : null,
      category: url.replace('https://www.govinfo.gov/rss/', '').replace('.xml', '')
    })));
    
    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
};