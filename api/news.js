import Parser from 'rss-parser';

const parser = new Parser();

const rssFeeds = [
  'https://www.govinfo.gov/rss/dcpd.xml',
  'https://www.govinfo.gov/rss/pai.xml',
  'https://www.govinfo.gov/rss/plaw.xml',
  'https://www.govinfo.gov/rss/comps.xml'
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const feedData = await Promise.all(
      rssFeeds.map(async (url) => {
        try {
          return await parser.parseURL(url);
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return { items: [] };
        }
      })
    );

    const articles = feedData.flatMap((feed, index) => 
      feed.items.map(item => ({
        title: item.title,
        link: item.link,
        content: item.contentSnippet || item.content,
        pubDate: item.pubDate,
        image: item.enclosure ? item.enclosure.url : null,
        category: rssFeeds[index].replace('https://www.govinfo.gov/rss/', '').replace('.xml', '')
      }))
    );

    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
}