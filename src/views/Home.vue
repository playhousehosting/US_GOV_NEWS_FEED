<template>
  <div class="cnn-clone">
    <header class="cnn-header">
      <h1>US Government News Feed</h1>
    </header>
    <div class="cnn-main">
      <section class="cnn-top-stories">
        <h2>Top Stories</h2>
        <div class="cnn-top-stories-grid">
          <div class="cnn-top-story" v-for="article in topStories" :key="article.link">
            <img v-if="article.image" :src="article.image" alt="News Image" class="cnn-top-story-image" />
            <div class="cnn-category">{{ article.category }}</div>
            <h2 class="cnn-title">{{ article.title }}</h2>
            <p class="cnn-content">{{ article.content }}</p>
            <a :href="article.link" target="_blank" class="cnn-read-more">Read more</a>
          </div>
        </div>
      </section>
      <aside class="cnn-sidebar">
        <h2>Categories</h2>
        <ul class="cnn-categories">
          <li v-for="category in categories" :key="category" @click="filterByCategory(category)" :class="{ active: selectedCategory === category }">
            {{ category }}
          </li>
        </ul>
      </aside>
    </div>
    <footer class="cnn-footer">
      <p>© 2025 US Government News Feed</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const selectedCategory = ref('');

const news = computed(() => {
  const allNews = store.state.news;
  if (!selectedCategory.value) return allNews;
  return allNews.filter(article => article.category === selectedCategory.value);
});

const topStories = computed(() => news.value.slice(0, 4));

const categories = computed(() => {
  const categorySet = new Set(store.state.news.map(article => article.category));
  return Array.from(categorySet);
});

const filterByCategory = (category: string) => {
  selectedCategory.value = selectedCategory.value === category ? '' : category;
};
</script>

<style scoped>
.cnn-clone {
  font-family: Arial, sans-serif;
  color: #333;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.cnn-header {
  background-color: #cc0000;
  color: #fff;
  padding: 20px;
  text-align: center;
}

.cnn-main {
  display: flex;
  padding: 20px;
  gap: 20px;
  flex: 1;
}

.cnn-top-stories {
  flex: 2;
}

.cnn-sidebar {
  flex: 1;
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
}

.cnn-top-stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.cnn-top-story {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.cnn-top-story:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cnn-top-story-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.cnn-category {
  display: inline-block;
  background-color: #f8f9fa;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.cnn-title {
  font-size: 1.2em;
  margin: 10px 0;
  line-height: 1.4;
}

.cnn-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.cnn-read-more {
  display: inline-block;
  color: #cc0000;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s ease;
}

.cnn-read-more:hover {
  color: #990000;
}

.cnn-categories {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cnn-categories li {
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.cnn-categories li:hover {
  background-color: #e0e0e0;
}

.cnn-categories li.active {
  background-color: #cc0000;
  color: #fff;
}

.cnn-footer {
  text-align: center;
  padding: 20px;
  background-color: #333;
  color: #fff;
  margin-top: auto;
}

@media (max-width: 768px) {
  .cnn-main {
    flex-direction: column;
  }

  .cnn-top-stories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
