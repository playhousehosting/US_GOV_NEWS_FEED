import { createStore } from 'vuex';
import axios from 'axios';

const store = createStore({
  state: {
    news: []
  },
  mutations: {
    setNews(state, news) {
      state.news = news;
    }
  },
  actions: {
    async fetchNews({ commit }) {
      try {
        const response = await axios.get('/api/news');
        commit('setNews', response.data);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    }
  }
});

export default store;
