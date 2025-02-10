<template>
  <div class="cnn-clone">
    <header class="cnn-header">
      <h1>CNN</h1>
    </header>
    <div class="cnn-main">
      <section class="cnn-top-stories">
        <h2>Top Stories</h2>
        <div class="cnn-top-stories-grid">
          <div class="cnn-top-story" v-for="article in topStories" :key="article.link">
            <img v-if="article.image" :src="article.image" alt="News Image" class="cnn-top-story-image" />
            <h3>{{ article.category }}</h3>
            <h2>{{ article.title }}</h2>
            <p>{{ article.content }}</p>
            <a :href="article.link" target="_blank">Read more</a>
          </div>
        </div>
      </section>
      <aside class="cnn-sidebar">
        <h2>Categories</h2>
        <ul>
          <li>Politics</li>
          <li>World</li>
          <li>Business</li>
          <li>Tech</li>
          <li>Entertainment</li>
        </ul>
      </aside>
    </div>
    <footer class="cnn-footer">
      <p>© 2025 CNN Clone</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const news = computed(() => store.state.news);

// Assuming the first 4 articles are top stories
const topStories = computed(() => news.value.slice(0, 4));
</script>

<style scoped>
.cnn-clone {
  font-family: Arial, sans-serif;
  color: #333;
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
}

.cnn-top-stories {
  flex: 2;
}

.cnn-sidebar {
  flex: 1;
  background-color: #f0f0f0;
  padding: 20px;
}

.cnn-top-stories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.cnn-top-story {
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.cnn-top-story-image {
  width: 100%;
  height: auto;
}

.cnn-footer {
  text-align: center;
  padding: 20px;
  background-color: #333;
  color: #fff;
}
</style>
