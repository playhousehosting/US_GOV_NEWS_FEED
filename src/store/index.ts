import { defineStore } from 'pinia';
import axios from 'axios';

interface Article {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  image: string | null;
  category: string;
}

interface State {
  news: Article[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
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
    selectedCategory: null
  }),

  getters: {
    getFilteredNews(): Article[] {
      if (!this.selectedCategory) return this.news;
      return this.news.filter(article => article.category === this.selectedCategory);
    },
    
    topStories(): Article[] {
      return this.getFilteredNews.slice(0, 4);
    },

    categories(): string[] {
      const categorySet = new Set(this.news.map(article => article.category));
      return Array.from(categorySet);
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
    }
  }
});

export type { Article, State };
