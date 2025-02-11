<template>
  <div class="cnn-clone">
    <header class="cnn-header">
      <h1>US Government News Feed</h1>
    </header>
    <div class="cnn-main">
      <section class="cnn-content">
        <div class="cnn-top-stories">
          <h2>Top Stories</h2>
          <div v-if="store.loading" class="loading">Loading news...</div>
          <div v-else-if="store.error" class="error">{{ store.error }}</div>
          <div v-else-if="store.getFilteredNews.length === 0" class="no-results">
            No news articles found{{ store.selectedCategory ? ` for category: ${store.selectedCategory}` : '' }}
          </div>
          <div v-else class="cnn-top-stories-grid">
            <div class="cnn-top-story featured" v-for="article in featuredArticles" :key="article.link">
              <img v-if="article.image" :src="article.image" alt="News Image" class="cnn-top-story-image" />
              <div class="cnn-category">{{ article.category }}</div>
              <h2 class="cnn-title">{{ article.title }}</h2>
              <p class="cnn-content">{{ article.content }}</p>
              <div class="cnn-meta">
                <span class="cnn-date">{{ formatDate(article.pubDate) }}</span>
                <a :href="article.link" target="_blank" class="cnn-read-more">Read more</a>
              </div>
            </div>
          </div>
        </div>

        <div class="cnn-all-stories" v-if="!store.loading && !store.error && remainingArticles.length > 0">
          <h2>More Stories</h2>
          <div class="cnn-stories-grid">
            <div class="cnn-story" v-for="article in paginatedArticles" :key="article.link">
              <img v-if="article.image" :src="article.image" alt="News Image" class="cnn-story-image" />
              <div class="cnn-category">{{ article.category }}</div>
              <h3 class="cnn-title">{{ article.title }}</h3>
              <p class="cnn-content">{{ article.content }}</p>
              <div class="cnn-meta">
                <span class="cnn-date">{{ formatDate(article.pubDate) }}</span>
                <a :href="article.link" target="_blank" class="cnn-read-more">Read more</a>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div class="pagination" v-if="totalPages > 1">
            <button 
              :disabled="currentPage === 1" 
              @click="currentPage--"
              class="pagination-btn"
            >
              Previous
            </button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              :disabled="currentPage === totalPages" 
              @click="currentPage++"
              class="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <aside class="cnn-sidebar">
        <h2>Categories</h2>
        <ul class="cnn-categories">
          <li @click="clearCategory" :class="{ active: !store.selectedCategory }">
            All Categories
          </li>
          <li v-for="category in store.categories" 
              :key="category" 
              @click="filterByCategory(category)" 
              :class="{ active: store.selectedCategory === category }">
            {{ category }}
          </li>
        </ul>

        <div class="cnn-stats" v-if="!store.loading && !store.error">
          <h3>Statistics</h3>
          <p>Total Articles: {{ store.getFilteredNews.length }}</p>
          <p>Categories: {{ store.categories.length }}</p>
          <p>Latest Update: {{ latestUpdate }}</p>
        </div>
      </aside>
    </div>
    <footer class="cnn-footer">
      <p>© 2025 US Government News Feed</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNewsStore } from '../store';

const store = useNewsStore();
const currentPage = ref(1);
const itemsPerPage = 12;

// Fetch news on component mount
onMounted(() => {
  store.fetchNews();
});

// Featured articles (top 4)
const featuredArticles = computed(() => 
  store.getFilteredNews.slice(0, 4)
);

// Remaining articles
const remainingArticles = computed(() => 
  store.getFilteredNews.slice(4)
);

// Paginated articles
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return remainingArticles.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => 
  Math.ceil(remainingArticles.value.length / itemsPerPage)
);

// Latest update
const latestUpdate = computed(() => {
  if (store.news.length === 0) return 'N/A';
  const latest = new Date(Math.max(...store.news.map(article => new Date(article.pubDate).getTime())));
  return formatDate(latest.toISOString());
});

// Methods
const filterByCategory = (category: string) => {
  store.setCategory(category);
  currentPage.value = 1;
};

const clearCategory = () => {
  store.setCategory(null);
  currentPage.value = 1;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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

.cnn-content {
  flex: 2;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #666;
}

.error {
  color: #cc0000;
}

.no-results {
  font-style: italic;
}

.cnn-top-stories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.cnn-stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.cnn-top-story, .cnn-story {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.cnn-top-story:hover, .cnn-story:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cnn-top-story.featured {
  grid-column: span 2;
}

.cnn-top-story-image, .cnn-story-image {
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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cnn-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.cnn-date {
  color: #666;
  font-size: 0.9em;
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

.cnn-sidebar {
  flex: 1;
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 20px;
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
  transition: all 0.2s ease;
}

.cnn-categories li:hover {
  background-color: #e0e0e0;
}

.cnn-categories li.active {
  background-color: #cc0000;
  color: #fff;
}

.cnn-stats {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.cnn-stats h3 {
  margin-top: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #cc0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #990000;
}

.pagination-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

.cnn-footer {
  text-align: center;
  padding: 20px;
  background-color: #333;
  color: #fff;
  margin-top: auto;
}

@media (max-width: 1200px) {
  .cnn-top-stories-grid {
    grid-template-columns: 1fr;
  }

  .cnn-top-story.featured {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .cnn-main {
    flex-direction: column;
  }

  .cnn-sidebar {
    position: static;
    margin-top: 20px;
  }

  .cnn-stories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
