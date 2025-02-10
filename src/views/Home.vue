<template>
  <div class="home">
    <h1>Latest News</h1>
    <div class="news-list">
      <div v-for="article in news" :key="article.link" class="news-item">
        <img v-if="article.image" :src="article.image" alt="News Image" class="news-image" />
        <h2>{{ article.title }}</h2>
        <p>{{ article.content }}</p>
        <a :href="article.link" target="_blank">Read more</a>
      </div>
    </div>
    <div class="scrolling-bar">
      <div v-for="article in news" :key="article.link" class="scrolling-item">
        {{ article.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const news = computed(() => store.state.news);
</script>

<style scoped>
.home {
  padding: 20px;
  background-color: #f9f9f9;
}

.news-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.news-item {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px;
  width: 300px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s;
}

.news-item:hover {
  transform: scale(1.05);
}

.news-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.scrolling-bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #f0f0f0;
  overflow: hidden;
  white-space: nowrap;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.scrolling-item {
  display: inline-block;
  margin-right: 20px;
  font-size: 14px;
  color: #333;
}
</style>
