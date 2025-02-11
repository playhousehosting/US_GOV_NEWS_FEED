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

interface State {
  news: Article[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  selectedType: 'all' | 'rss' | 'executive_order';
  selectedStatus: 'all' | 'published' | 'pending_publication';
}

// Get the base URL from environment or default to current origin
const baseURL = import.meta.env.VITE_API_URL || window.location.origin;

// Create axios instance with base URL
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useNewsStore = defineStore('news', {
  state: (): State => ({
    news: [],
    loading: false,
    error: null,
    selectedCategory: null,
    selectedType: 'all',
    selectedStatus: 'all'
  }),

  getters: {
    getFilteredNews(): Article[] {
      let filtered = this.news;

      // Filter by type
      if (this.selectedType !== 'all') {
        filtered = filtered.filter(article => article.type === this.selectedType);
      }

      // Filter by category
      if (this.selectedCategory) {
        filtered = filtered.filter(article => article.category === this.selectedCategory);
      }

      // Filter by status
      if (this.selectedStatus !== 'all') {
        filtered = filtered.filter(article => article.status === this.selectedStatus);
      }

      return filtered;
    },
    
    topStories(): Article[] {
      return this.getFilteredNews.slice(0, 4);
    },

    categories(): string[] {
      const categorySet = new Set(this.news.map(article => article.category));
      return Array.from(categorySet).sort();
    },

    executiveOrders(): Article[] {
      return this.news
        .filter(article => article.type === 'executive_order')
        .sort((a, b) => {
          const aNum = parseInt(a.executiveOrderNumber || '0');
          const bNum = parseInt(b.executiveOrderNumber || '0');
          return bNum - aNum;
        });
    },

    pendingExecutiveOrders(): Article[] {
      return this.executiveOrders.filter(article => article.status === 'pending_publication');
    },

    publishedExecutiveOrders(): Article[] {
      return this.executiveOrders.filter(article => article.status !== 'pending_publication');
    },

    articlesByType(): Record<string, number> {
      return {
        all: this.news.length,
        rss: this.news.filter(article => article.type === 'rss').length,
        executive_order: this.news.filter(article => article.type === 'executive_order').length
      };
    },

    articlesByStatus(): Record<string, number> {
      const eoArticles = this.executiveOrders;
      return {
        all: eoArticles.length,
        published: eoArticles.filter(article => article.status !== 'pending_publication').length,
        pending_publication: eoArticles.filter(article => article.status === 'pending_publication').length
      };
    }
  },

  actions: {
    async fetchNews() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.get<Article[]>('/api/news');
        
        if (response.data && Array.isArray(response.data)) {
          // Sort articles by date, most recent first
          this.news = response.data.sort((a, b) => 
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
          );
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        if (axios.isAxiosError(error)) {
          this.error = error.response?.data?.message || 'Failed to load news. Please try again later.';
        } else {
          this.error = 'Failed to load news. Please try again later.';
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
    }
  }
});

export type { Article, State };
