const express = require('express');
const axios = require('axios');
const parser = require('rss-parser');
const app = express();
const port = 3000;

const parserInstance = new parser();

const rssFeeds = [
  'https://www.govinfo.gov/rss/dcpd.xml',
  'https://www.govinfo.gov/rss/pai.xml',
  'https://www.govinfo.gov/rss/plaw.xml',
  'https://www.govinfo.gov/rss/comps.xml'
];

app.get('/api/news', async (req, res) => {
  try {
    const feedData = await Promise.all(rssFeeds.map(url => parserInstance.parseURL(url)));
    const articles = feedData.flatMap(feed => feed.items.map(item => ({
      title: item.title,
      link: item.link,
      content: item.contentSnippet,
      pubDate: item.pubDate,
      image: item.enclosure ? item.enclosure.url : null
    })));
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
