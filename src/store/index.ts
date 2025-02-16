import { defineStore } from 'pinia';
import axios from 'axios';

interface Article {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  image: string | null;
  category: string;
  type: 'rss' | 'executive_order';
  pdfUrl?: string;
  documentNumber?: string;
  signingDate?: string;
  executiveOrderNumber?: string;
  fullTextUrl?: string;
  jsonUrl?: string;
  bodyHtmlUrl?: string;
  citation?: string;
  status?: 'published' | 'pending_publication';
}

interface ApiResponse {
  success: boolean;
  timestamp: string;
  articles: Article[];
  meta: {
    total: number;
    sources: {
      rss: number;
      federalRegister: number;
      publicInspection: number;
    };
    processingTime: number;
  };
}

interface State {
  news: Article[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  selectedType: 'all' | 'rss' | 'executive_order';
  selectedStatus: 'all' | 'published' | 'pending_publication';
  searchQuery: string;
}

// Helper function to determine the API base URL
const getBaseURL = () => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use the current origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  // In development, default to localhost:3000
  return 'http://localhost:3000';
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and retry configuration
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500, // Don't reject if status is 4xx
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] Status: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);
    return Promise.reject(error);
  }
);

export const useNewsStore = defineStore('news', {
  state: (): State => ({
    news: [],
    loading: false,
    error: null,
    selectedCategory: null,
    selectedType: 'all',
    selectedStatus: 'all',
    searchQuery: ''
  }),

  getters: {
    getFilteredNews(): Article[] {
      try {
        // Ensure news array exists and is not empty
        if (!this.news || !Array.isArray(this.news)) {
          return [];
        }

        let filtered = [...this.news];

        // Filter by search query
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(article => {
            if (!article) return false;
            return (
              (article.title?.toLowerCase().includes(query)) ||
              (article.content?.toLowerCase().includes(query)) ||
              (article.category?.toLowerCase().includes(query)) ||
              (article.documentNumber?.toLowerCase().includes(query)) ||
              (article.citation?.toLowerCase().includes(query))
            );
          });
        }

        // Filter by type
        if (this.selectedType !== 'all') {
          filtered = filtered.filter(article => article?.type === this.selectedType);
        }

        // Filter by category
        if (this.selectedCategory) {
          filtered = filtered.filter(article => article?.category === this.selectedCategory);
        }

        // Filter by status
        if (this.selectedStatus !== 'all') {
          filtered = filtered.filter(article => article?.status === this.selectedStatus);
        }

        // Sort by date, newest first
        return filtered.sort((a, b) => {
          try {
            const dateA = new Date(a?.signingDate || a?.pubDate || 0);
            const dateB = new Date(b?.signingDate || b?.pubDate || 0);
            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.error('Error sorting articles:', error);
            return 0;
          }
        });
      } catch (error) {
        console.error('Error in getFilteredNews:', error);
        return [];
      }
    },
    
    topStories(): Article[] {
      return this.getFilteredNews.slice(0, 4);
    },

    categories(): string[] {
      try {
        if (!this.news || !Array.isArray(this.news)) return [];
        const categorySet = new Set(
          this.news
            .filter(article => article && article.category)
            .map(article => article.category)
        );
        return Array.from(categorySet).sort();
      } catch (error) {
        console.error('Error in categories getter:', error);
        return [];
      }
    },

    executiveOrders(): Article[] {
      try {
        if (!this.news || !Array.isArray(this.news)) return [];
        return this.news
          .filter(article => article && article.type === 'executive_order')
          .sort((a, b) => {
            try {
              // Sort by signing date first
              const dateA = new Date(a?.signingDate || a?.pubDate || 0);
              const dateB = new Date(b?.signingDate || b?.pubDate || 0);
              const dateDiff = dateB.getTime() - dateA.getTime();
              
              if (dateDiff !== 0) return dateDiff;
              
              // If same date, sort by executive order number
              const aNum = parseInt(a?.executiveOrderNumber || '0');
              const bNum = parseInt(b?.executiveOrderNumber || '0');
              return bNum - aNum;
            } catch (error) {
              console.error('Error sorting executive orders:', error);
              return 0;
            }
          });
      } catch (error) {
        console.error('Error in executiveOrders getter:', error);
        return [];
      }
    },

    pendingExecutiveOrders(): Article[] {
      try {
        return this.executiveOrders.filter(article => article?.status === 'pending_publication');
      } catch (error) {
        console.error('Error in pendingExecutiveOrders getter:', error);
        return [];
      }
    },

    publishedExecutiveOrders(): Article[] {
      try {
        return this.executiveOrders.filter(article => article?.status !== 'pending_publication');
      } catch (error) {
        console.error('Error in publishedExecutiveOrders getter:', error);
        return [];
      }
    },

    articlesByType(): Record<string, number> {
      try {
        if (!this.news || !Array.isArray(this.news)) {
          return { all: 0, rss: 0, executive_order: 0 };
        }
        return {
          all: this.news.length,
          rss: this.news.filter(article => article?.type === 'rss').length,
          executive_order: this.news.filter(article => article?.type === 'executive_order').length
        };
      } catch (error) {
        console.error('Error in articlesByType getter:', error);
        return { all: 0, rss: 0, executive_order: 0 };
      }
    },

    articlesByStatus(): Record<string, number> {
      try {
        const eoArticles = this.executiveOrders;
        return {
          all: eoArticles.length,
          published: eoArticles.filter(article => article?.status !== 'pending_publication').length,
          pending_publication: eoArticles.filter(article => article?.status === 'pending_publication').length
        };
      } catch (error) {
        console.error('Error in articlesByStatus getter:', error);
        return { all: 0, published: 0, pending_publication: 0 };
      }
    },

    searchResults(): {
      total: number;
      byType: Record<string, number>;
      byCategory: Record<string, number>;
    } {
      try {
        const filtered = this.getFilteredNews;
        if (!filtered || !Array.isArray(filtered)) {
          return {
            total: 0,
            byType: { rss: 0, executive_order: 0 },
            byCategory: {}
          };
        }

        const byType = {
          rss: filtered.filter(article => article?.type === 'rss').length,
          executive_order: filtered.filter(article => article?.type === 'executive_order').length
        };

        const byCategory = filtered.reduce((acc, article) => {
          if (article?.category) {
            acc[article.category] = (acc[article.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        return {
          total: filtered.length,
          byType,
          byCategory
        };
      } catch (error) {
        console.error('Error in searchResults getter:', error);
        return {
          total: 0,
          byType: { rss: 0, executive_order: 0 },
          byCategory: {}
        };
      }
    }
  },

  actions: {
    async fetchNews() {
      this.loading = true;
      this.error = null;
      this.news = []; // Initialize with empty array
      
      try {
        const response = await api.get<ApiResponse>('/api/news');
        
        if (response?.data?.success && Array.isArray(response.data.articles)) {
          // Validate and clean the data
          const validArticles = response.data.articles.filter(article =>
            article &&
            typeof article === 'object' &&
            article.title &&
            article.link &&
            (article.pubDate || article.signingDate) &&
            article.category &&
            ['rss', 'executive_order'].includes(article.type)
          );

          if (validArticles.length === 0) {
            console.warn('No valid articles found in response');
            this.error = 'No valid articles found';
            this.news = [];
            return;
          }

          // Articles are already sorted by date from the API
          this.news = validArticles;

          // Log statistics
          console.log('News fetched successfully:', {
            total: response.data.meta.total,
            valid: validArticles.length,
            sources: response.data.meta.sources,
            processingTime: response.data.meta.processingTime
          });
        } else {
          console.error('Invalid API response format:', response.data);
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        if (axios.isAxiosError(error)) {
          this.error = error.response?.data?.message ||
            error.message ||
            'Failed to load news. Please try again later.';
        } else {
          this.error = error instanceof Error ?
            error.message :
            'Failed to load news. Please try again later.';
        }
      } finally {
        this.loading = false;
      }
    },

    setCategory(category: string | null) {
      this.selectedCategory = category;
    },

    setType(type: 'all' | 'rss' | 'executive_order') {
      this.selectedType = type;
    },

    setStatus(status: 'all' | 'published' | 'pending_publication') {
      this.selectedStatus = status;
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    }
  }
});

export type { Article, State };
