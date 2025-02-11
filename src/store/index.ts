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
        const response = await axios.get<Article[]>('/api/news');
        if (response.data && Array.isArray(response.data)) {
          this.news = response.data;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        this.error = 'Failed to load news. Please try again later.';
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
