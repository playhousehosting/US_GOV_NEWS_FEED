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
  'https://www.govinfo.gov/rss/comps.xml',
  'https://www.govinfo.gov/rss/budget.xml'
];

const feedCategories = {
  'dcpd': 'Presidential Communications',
  'pai': 'Public and Private Laws',
  'plaw': 'Public Laws',
  'comps': 'Federal Regulations',
  'budget': 'Budget Documents'
};

// Federal Register API configuration
const FR_API_BASE = 'https://www.federalregister.gov/api/v1';
const FR_FORMAT = 'json';

// Helper function to handle errors
const handleError = (error) => {
  console.error('Error:', error);
  return {
    error: true,
    message: error.message || 'An error occurred while fetching the data',
    status: error.response?.status || 500
  };
};

// Federal Register API functions
const getFederalRegisterDocuments = async () => {
  const params = {
    conditions: {
      type: ['PRESDOCU'],
      presidential_document_type: 'executive_order',
      correction: '0',
      president: 'donald-trump',
      signing_date: {
        gte: '2025-01-20',
        lte: new Date().toISOString().split('T')[0]
      }
    },
    fields: [
      'citation',
      'document_number',
      'html_url',
      'pdf_url',
      'type',
      'subtype',
      'publication_date',
      'signing_date',
      'title',
      'executive_order_number',
      'body_html_url',
      'full_text_xml_url',
      'json_url'
    ],
    per_page: 1000,
    order: 'executive_order'
  };

  const response = await axios.get(`${FR_API_BASE}/documents.${FR_FORMAT}`, { params });
  return response.data.results;
};

const getPublicInspectionDocuments = async () => {
  const response = await axios.get(`${FR_API_BASE}/public-inspection-documents.${FR_FORMAT}`, {
    params: {
      conditions: {
        type: ['PRESDOCU'],
        special_filing: '0'
      }
    }
  });
  return response.data.results;
};

const getDocumentDetails = async (documentNumber) => {
  const response = await axios.get(`${FR_API_BASE}/documents/${documentNumber}.${FR_FORMAT}`);
  return response.data;
};

// Transform Federal Register document
const transformFederalRegisterDoc = (doc) => ({
  title: `Executive Order ${doc.executive_order_number}: ${doc.title}`,
  link: doc.html_url,
  content: doc.abstract || `Document Number: ${doc.document_number}\nCitation: ${doc.citation}`,
  pubDate: doc.publication_date,
  image: null,
  category: 'Executive Orders',
  type: 'executive_order',
  pdfUrl: doc.pdf_url,
  documentNumber: doc.document_number,
  signingDate: doc.signing_date,
  executiveOrderNumber: doc.executive_order_number,
  fullTextUrl: doc.full_text_xml_url,
  jsonUrl: doc.json_url,
  bodyHtmlUrl: doc.body_html_url,
  citation: doc.citation
});

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
    // Fetch all data sources concurrently
    const [feedData, frDocuments, piDocuments] = await Promise.all([
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
      getFederalRegisterDocuments(),
      getPublicInspectionDocuments()
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

    // Process Federal Register documents
    const frArticles = frDocuments.map(transformFederalRegisterDoc);
    const piArticles = piDocuments
      .filter(doc => doc.type === 'PRESDOCU' && doc.subtype === 'EO')
      .map(doc => ({
        ...transformFederalRegisterDoc(doc),
        status: 'pending_publication'
      }));

    // Combine all articles and remove duplicates
    const allArticles = [...rssArticles, ...frArticles, ...piArticles]
      .reduce((acc, current) => {
        const x = acc.find(item => item.link === current.link);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [])
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Send response with cache headers
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(allArticles);
  } catch (error) {
    const { message, status } = handleError(error);
    res.status(status).json({ error: true, message });
  }
};