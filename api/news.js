const Parser = require('rss-parser');
const axios = require('axios');

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

// Federal Register API URL
const getFederalRegisterURL = () => {
  const today = new Date();
  const startDate = '01/20/2025';
  const endDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  
  return `https://www.federalregister.gov/api/v1/documents.json?conditions%5Bcorrection%5D=0&conditions%5Bpresident%5D=donald-trump&conditions%5Bpresidential_document_type%5D=executive_order&conditions%5Bsigning_date%5D%5Bgte%5D=${startDate}&conditions%5Bsigning_date%5D%5Blte%5D=${endDate}&conditions%5Btype%5D%5B%5D=PRESDOCU&fields%5B%5D=citation&fields%5B%5D=document_number&fields%5B%5D=html_url&fields%5B%5D=pdf_url&fields%5B%5D=type&fields%5B%5D=subtype&fields%5B%5D=publication_date&fields%5B%5D=signing_date&fields%5B%5D=title&fields%5B%5D=executive_order_number&fields%5B%5D=body_html_url&per_page=10000`;
};

// Helper function to handle errors
const handleError = (error) => {
  console.error('Error:', error);
  return {
    error: true,
    message: error.message || 'An error occurred while fetching the data',
    status: error.response?.status || 500
  };
};

// Transform Federal Register data
const transformFederalRegisterData = (data) => {
  return data.results.map(item => ({
    title: `Executive Order ${item.executive_order_number}: ${item.title}`,
    link: item.html_url,
    content: `Document Number: ${item.document_number}\nCitation: ${item.citation}`,
    pubDate: item.publication_date,
    image: null,
    category: 'Executive Orders',
    type: 'executive_order',
    pdfUrl: item.pdf_url,
    documentNumber: item.document_number,
    signingDate: item.signing_date,
    executiveOrderNumber: item.executive_order_number
  }));
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
    // Fetch RSS feeds and Federal Register data concurrently
    const [feedData, federalRegisterResponse] = await Promise.all([
      Promise.all(
        rssFeeds.map(async (url) => {
          try {
            const feed = await parser.parseURL(url);
            const category = url.match(/\/rss\/([^.]+)\.xml$/)[1];
            return {
              items: feed.items.map(item => ({
                ...item,
                type: 'rss'
              })),
              category: feedCategories[category] || category
            };
          } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return { items: [], category: '' };
          }
        })
      ),
      axios.get(getFederalRegisterURL())
    ]);

    // Process RSS feed articles
    const rssArticles = feedData
      .flatMap(({ items, category }) => 
        items.map(item => ({
          title: item.title,
          link: item.link,
          content: item.contentSnippet || item.content || '',
          pubDate: item.pubDate,
          image: item.enclosure ? item.enclosure.url : null,
          category: category,
          type: 'rss'
        }))
      )
      .filter(article => article.title && article.link);

    // Process Federal Register articles
    const federalRegisterArticles = transformFederalRegisterData(federalRegisterResponse.data);

    // Combine and sort all articles
    const allArticles = [...rssArticles, ...federalRegisterArticles]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Send response with cache headers
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(allArticles);
  } catch (error) {
    const { message, status } = handleError(error);
    res.status(status).json({ error: true, message });
  }
};