const Parser = require('rss-parser');
const axios = require('axios');
const xml2js = require('xml2js');

// Configure parser with custom User-Agent and better error handling
const parser = new Parser({
  headers: {
    'User-Agent': 'US-Government-News-Feed/1.0 (https://us-gov-news-feed.vercel.app)'
  },
  timeout: 15000, // Increased timeout
  maxRedirects: 5,
  customFields: {
    item: [
      ['title', 'title'],
      ['link', 'link'],
      ['pubDate', 'pubDate'],
      ['description', 'content'],
      ['content:encoded', 'content'],
      ['dc:creator', 'author'],
      ['category', 'category']
    ]
  }
});

// Configure XML parser with better error handling
const xmlParser = new xml2js.Parser({
  explicitArray: false,
  trim: true,
  explicitRoot: false,
  emptyTag: null,
  ignoreAttrs: true
});

const rssFeeds = [
  'https://www.govinfo.gov/rss/dcpd.xml',
  'https://www.govinfo.gov/rss/pai.xml',
  'https://www.govinfo.gov/rss/plaw.xml',
  'https://www.govinfo.gov/rss/comps.xml',
  'https://www.govinfo.gov/rss/budget.xml',
  'https://www.govinfo.gov/rss/uscourts-ksd.xml',
  'https://www.govinfo.gov/rss/uscourts-okeb.xml',
  'https://www.govinfo.gov/rss/uscourts-oknb.xml',
  'https://www.govinfo.gov/rss/uscourts-okwb.xml',
  'https://www.govinfo.gov/rss/uscourts-moeb.xml',
  'https://www.govinfo.gov/rss/uscourts-mowb.xml',
  'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=400&Site=945&max=10',
  'https://www.govinfo.gov/rss/uscourts-ded.xml'
];

const feedCategories = {
  'dcpd': 'Presidential Communications',
  'pai': 'Public and Private Laws',
  'plaw': 'Public Laws',
  'comps': 'Federal Regulations',
  'budget': 'Budget Documents',
  'uscourts-ksd': 'US Courts - Kansas District',
  'uscourts-okeb': 'US Courts - OK Eastern Bankruptcy',
  'uscourts-oknb': 'US Courts - OK Northern Bankruptcy',
  'uscourts-okwb': 'US Courts - OK Western Bankruptcy',
  'uscourts-moeb': 'US Courts - MO Eastern Bankruptcy',
  'uscourts-mowb': 'US Courts - MO Western Bankruptcy',
  'uscourts-ded': 'US Courts - Delaware District',
  'defense.gov': 'Department of Defense'
};

// Helper function to extract package ID from URL
const extractPackageId = (url) => {
  const match = url.match(/pkg\/([^/]+)/);
  return match ? match[1] : null;
};

// Helper function to get metadata URL
const getMetadataUrl = (packageId) => {
  return `https://www.govinfo.gov/metadata/pkg/${packageId}/premis.xml`;
};

// Helper function to fetch and parse XML
const fetchXmlMetadata = async (url) => {
  try {
    const response = await axios.get(url);
    const result = await xmlParser.parseStringPromise(response.data);
    return result;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
};

// Helper function to extract metadata from PREMIS XML
const extractMetadata = (premisData) => {
  try {
    const premis = premisData.premis;
    const object = premis.object;
    
    // Extract relevant information
    const metadata = {
      objectIdentifier: object?.objectIdentifier?.objectIdentifierValue,
      preservationLevel: object?.preservationLevel?.preservationLevelValue,
      objectCharacteristics: {
        size: object?.objectCharacteristics?.size,
        format: object?.objectCharacteristics?.format?.formatName,
        version: object?.objectCharacteristics?.format?.formatVersion,
      },
      originalName: object?.originalName,
      relationship: object?.relationship?.relationshipType,
      eventType: premis.event?.eventType,
      eventDateTime: premis.event?.eventDateTime,
      eventDetail: premis.event?.eventDetail,
    };

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
};

// Federal Register API configuration
const FR_API_BASE = 'https://www.federalregister.gov/api/v1';
const FR_FORMAT = 'json';

// Create axios instance for Federal Register API with retry logic
const frApi = axios.create({
  baseURL: FR_API_BASE,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'US-Government-News-Feed/1.0 (https://us-gov-news-feed.vercel.app)'
  }
});

// Add response interceptor for rate limiting
frApi.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      log('Rate limited by Federal Register API', { retryAfter });
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return frApi.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Helper function to handle errors with better context
const handleError = (error) => {
  const errorInfo = {
    error: true,
    message: error.message || 'An error occurred while fetching the data',
    status: error.response?.status || 500,
    timestamp: new Date().toISOString()
  };

  if (error.response?.data) {
    errorInfo.details = error.response.data;
  }

  if (error.config) {
    errorInfo.request = {
      url: error.config.url,
      method: error.config.method,
      timeout: error.config.timeout
    };
  }

  log('Error details:', errorInfo);
  return errorInfo;
};

// Federal Register API functions
const getFederalRegisterDocuments = async () => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    log('Fetching Federal Register documents', { fromDate: '2025-01-20', toDate: currentDate });

    const params = {
      conditions: {
        type: ['PRESDOCU'],
        presidential_document_type: 'executive_order',
        correction: '0',
        president: 'donald-trump',
        signing_date: {
          gte: '2025-01-20',
          lte: currentDate
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
        'json_url',
        'abstract'
      ],
      per_page: 1000,
      order: 'executive_order'
    };

    const response = await frApi.get(`/documents.${FR_FORMAT}`, { params });
    
    if (!response.data?.results) {
      throw new Error('Invalid Federal Register API response format');
    }

    log('Successfully fetched Federal Register documents', {
      count: response.data.results.length,
      firstDocument: response.data.results[0]?.document_number
    });

    return response.data.results;
  } catch (error) {
    const errorInfo = handleError(error);
    log('Error fetching Federal Register documents', errorInfo);
    throw error;
  }
};

const getPublicInspectionDocuments = async () => {
  try {
    log('Fetching Public Inspection documents');

    const response = await frApi.get(`/public-inspection-documents.${FR_FORMAT}`, {
      params: {
        conditions: {
          type: ['PRESDOCU'],
          special_filing: '0'
        },
        fields: [
          'title',
          'document_number',
          'html_url',
          'pdf_url',
          'type',
          'subtype',
          'publication_date',
          'filing_date',
          'executive_order_number'
        ]
      }
    });

    if (!response.data?.results) {
      throw new Error('Invalid Public Inspection API response format');
    }

    log('Successfully fetched Public Inspection documents', {
      count: response.data.results.length,
      types: [...new Set(response.data.results.map(doc => doc.type))]
    });

    return response.data.results;
  } catch (error) {
    const errorInfo = handleError(error);
    log('Error fetching Public Inspection documents', errorInfo);
    throw error;
  }
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

// Process RSS item with metadata
const processRssItem = async (item, category) => {
  const baseArticle = {
    title: item.title,
    link: item.link,
    content: item.contentSnippet || item.content || '',
    pubDate: item.pubDate,
    image: item.enclosure ? item.enclosure.url : null,
    category: category,
    type: 'rss'
  };

  // Special handling for Defense.gov feed
  if (category === 'Department of Defense') {
    // Defense.gov feeds often have images in the content
    const imageMatch = baseArticle.content.match(/<img[^>]+src="([^">]+)"/i);
    if (imageMatch && imageMatch[1]) {
      baseArticle.image = imageMatch[1];
    }
    
    // Clean up content (remove HTML)
    baseArticle.content = baseArticle.content
      .replace(/<[^>]+>/g, ' ')  // Replace HTML tags with spaces
      .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
      .trim();                   // Trim whitespace
  }

  // If it's a budget document, fetch additional metadata
  if (category === 'Budget Documents') {
    const packageId = extractPackageId(item.link);
    if (packageId) {
      const metadataUrl = getMetadataUrl(packageId);
      const premisData = await fetchXmlMetadata(metadataUrl);
      if (premisData) {
        const metadata = extractMetadata(premisData);
        return {
          ...baseArticle,
          metadata,
          content: `${baseArticle.content}\n\nDocument Details:\n` +
            `Format: ${metadata.objectCharacteristics?.format || 'N/A'}\n` +
            `Version: ${metadata.objectCharacteristics?.version || 'N/A'}\n` +
            `Size: ${metadata.objectCharacteristics?.size || 'N/A'}\n` +
            `Last Modified: ${metadata.eventDateTime || 'N/A'}\n` +
            `Preservation Level: ${metadata.preservationLevel || 'N/A'}`
        };
      }
    }
  }

  return baseArticle;
};

// Helper function to log with timestamp
const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Helper function to handle errors
const handleApiError = (error, source) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error in ${source}:`, error);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  }
  return {
    error: true,
    source,
    message: error.message,
    timestamp
  };
};

module.exports = async (req, res) => {
  const startTime = Date.now();
  log('API request received', { method: req.method, url: req.url });

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
    log('Preflight request handled');
    return;
  }

  try {
    log('Starting data fetch');
    
    // Fetch all data sources with better error handling
    let feedData = [], frDocuments = [], piDocuments = [];
    
    try {
      // Fetch RSS feeds with timeout
      feedData = await Promise.all(
        rssFeeds.map(async (url) => {
          try {
            const feed = await parser.parseURL(url);
            let category = '';
            let categoryName = '';
            
            // Handle different URL formats
            if (url.includes('defense.gov')) {
              category = 'defense.gov';
              categoryName = feedCategories[category] || 'Department of Defense';
            } else {
              const categoryMatch = url.match(/\/rss\/([^.]+)\.xml$/);
              if (!categoryMatch) {
                log(`Invalid RSS feed URL format: ${url}`);
                return { items: [], category: '' };
              }
              
              category = categoryMatch[1];
              categoryName = feedCategories[category] || category;
            }
            
            // Process each item in the feed
            const items = await Promise.all(
              (feed.items || []).map(item => processRssItem(item, categoryName))
            );
            
            log(`Successfully fetched RSS feed: ${url}`, {
              itemCount: items.length,
              category: categoryName
            });
            
            return { items, category: categoryName };
          } catch (error) {
            log(`Error fetching RSS feed: ${url}`, { error: error.message });
            return { items: [], category: '' };
          }
        })
      );

      // Fetch Federal Register documents
      try {
        frDocuments = await getFederalRegisterDocuments();
        log('Successfully fetched Federal Register documents', {
          count: frDocuments.length
        });
      } catch (error) {
        log('Error fetching Federal Register documents', { error: error.message });
        frDocuments = [];
      }

      // Fetch Public Inspection documents
      try {
        piDocuments = await getPublicInspectionDocuments();
        log('Successfully fetched Public Inspection documents', {
          count: piDocuments.length
        });
      } catch (error) {
        log('Error fetching Public Inspection documents', { error: error.message });
        piDocuments = [];
      }
    } catch (error) {
      log('Error fetching data sources', { error: error.message });
      // Continue with empty arrays for failed sources
    }

    // Process RSS feed articles
    const rssArticles = feedData
      .flatMap(({ items }) => items)
      .filter(article => article.title && article.link);

    // Process Federal Register documents
    const frArticles = frDocuments.map(transformFederalRegisterDoc);
    const piArticles = piDocuments
      .filter(doc => doc.type === 'PRESDOCU' && doc.subtype === 'EO')
      .map(doc => ({
        ...transformFederalRegisterDoc(doc),
        status: 'pending_publication'
      }));

    // Validate and combine articles
    const validateArticle = (article) => {
      return article &&
        typeof article === 'object' &&
        typeof article.title === 'string' &&
        typeof article.link === 'string' &&
        (article.pubDate || article.signingDate) &&
        typeof article.category === 'string' &&
        ['rss', 'executive_order'].includes(article.type);
    };

    // Combine all articles and remove duplicates
    const allArticles = [...rssArticles, ...frArticles, ...piArticles]
      .filter(validateArticle)
      .reduce((acc, current) => {
        const x = acc.find(item => item.link === current.link);
        if (!x) {
          return acc.concat([current]);
        }
        return acc;
      }, [])
      .sort((a, b) => {
        try {
          const dateA = new Date(a.pubDate || a.signingDate || 0);
          const dateB = new Date(b.pubDate || b.signingDate || 0);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          log('Error sorting articles', { error: error.message });
          return 0;
        }
      });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log response statistics
    log('API request completed', {
      duration: `${duration}ms`,
      articleCount: allArticles.length,
      rssCount: rssArticles.length,
      frCount: frArticles.length,
      piCount: piArticles.length
    });

    // Validate final result
    if (!allArticles || !Array.isArray(allArticles)) {
      throw new Error('Failed to process articles');
    }

    if (allArticles.length === 0) {
      log('No articles found');
      res.status(404).json({
        success: false,
        error: true,
        message: 'No articles found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Send response with cache headers
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      articles: allArticles,
      meta: {
        total: allArticles.length,
        sources: {
          rss: rssArticles.length,
          federalRegister: frArticles.length,
          publicInspection: piArticles.length
        },
        processingTime: duration
      }
    });
  } catch (error) {
    const errorDetails = handleApiError(error, 'main');
    log('API request failed', errorDetails);
    
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      error: true,
      message: errorDetails.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      details: errorDetails
    });
  }
};