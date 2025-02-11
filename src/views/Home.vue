<template>
  <div class="cnn-clone">
    <header class="cnn-header">
      <h1>US Government News Feed</h1>
      <div class="type-filter">
        <button 
          v-for="type in types" 
          :key="type.value"
          :class="{ active: store.selectedType === type.value }"
          @click="filterByType(type.value)"
        >
          {{ type.label }} ({{ store.articlesByType[type.value] }})
        </button>
      </div>
      <div v-if="store.selectedType === 'executive_order'" class="status-filter">
        <button 
          v-for="status in statuses" 
          :key="status.value"
          :class="{ active: store.selectedStatus === status.value }"
          @click="filterByStatus(status.value)"
        >
          {{ status.label }} ({{ store.articlesByStatus[status.value] }})
        </button>
      </div>
    </header>

    <div class="cnn-main">
      <section class="cnn-content">
        <div v-if="store.selectedType === 'executive_order'" class="executive-orders">
          <h2>Executive Orders</h2>
          <div v-if="store.loading" class="loading">Loading executive orders...</div>
          <div v-else-if="store.error" class="error">{{ store.error }}</div>
          <div v-else-if="store.getFilteredNews.length === 0" class="no-results">
            No executive orders found
          </div>
          <div v-else class="executive-orders-grid">
            <div v-for="order in store.getFilteredNews" :key="order.link" class="executive-order">
              <div class="order-header">
                <h3>{{ order.title }}</h3>
                <span :class="['status-badge', order.status]">
                  {{ order.status === 'pending_publication' ? 'Pending Publication' : 'Published' }}
                </span>
              </div>
              <div class="order-meta">
                <div class="meta-item">
                  <span class="meta-label">Document Number:</span>
                  <span>{{ order.documentNumber }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Signed:</span>
                  <span>{{ formatDate(order.signingDate || order.pubDate) }}</span>
                </div>
                <div v-if="order.citation" class="meta-item">
                  <span class="meta-label">Citation:</span>
                  <span>{{ order.citation }}</span>
                </div>
              </div>
              <p class="order-content">{{ order.content }}</p>
              <div class="order-actions">
                <a :href="order.link" target="_blank" class="btn">View Online</a>
                <a v-if="order.pdfUrl" :href="order.pdfUrl" target="_blank" class="btn">Download PDF</a>
                <a v-if="order.fullTextUrl" :href="order.fullTextUrl" target="_blank" class="btn">Full Text XML</a>
                <a v-if="order.bodyHtmlUrl" :href="order.bodyHtmlUrl" target="_blank" class="btn">Body HTML</a>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
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
          <p>RSS Articles: {{ store.articlesByType.rss }}</p>
          <p>Executive Orders: {{ store.articlesByType.executive_order }}</p>
          <template v-if="store.selectedType === 'executive_order'">
            <p>Published: {{ store.articlesByStatus.published }}</p>
            <p>Pending: {{ store.articlesByStatus.pending_publication }}</p>
          </template>
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
import { ref, computed } from 'vue';
import { useNewsStore } from '../store';

const store = useNewsStore();
const currentPage = ref(1);
const itemsPerPage = 12;

const types = [
  { value: 'all', label: 'All News' },
  { value: 'rss', label: 'RSS News' },
  { value: 'executive_order', label: 'Executive Orders' }
] as const;

const statuses = [
  { value: 'all', label: 'All Orders' },
  { value: 'published', label: 'Published' },
  { value: 'pending_publication', label: 'Pending' }
] as const;

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

const filterByType = (type: 'all' | 'rss' | 'executive_order') => {
  store.setType(type);
  store.setCategory(null);
  currentPage.value = 1;
};

const filterByStatus = (status: 'all' | 'published' | 'pending_publication') => {
  store.setStatus(status);
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

.type-filter, .status-filter {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.type-filter button, .status-filter button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 8px 16px;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.type-filter button:hover, .status-filter button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.type-filter button.active, .status-filter button.active {
  background: rgba(255, 255, 255, 0.3);
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

.executive-orders-grid {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.executive-order {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 15px;
}

.order-header h3 {
  margin: 0;
  flex: 1;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
}

.status-badge.pending_publication {
  background-color: #ffd700;
  color: #333;
}

.status-badge.published {
  background-color: #4caf50;
  color: white;
}

.order-meta {
  display: grid;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.meta-item {
  display: flex;
  gap: 10px;
}

.meta-label {
  color: #666;
  min-width: 120px;
}

.order-content {
  margin: 15px 0;
  line-height: 1.6;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #cc0000;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  font-size: 0.9em;
}

.btn:hover {
  background-color: #990000;
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
  .type-filter, .status-filter {
    flex-direction: column;
  }

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

  .order-meta {
    grid-template-columns: 1fr;
  }

  .meta-item {
    flex-direction: column;
    gap: 5px;
  }

  .meta-label {
    min-width: auto;
  }

  .order-actions {
    flex-direction: column;
  }

  .btn {
    text-align: center;
  }
}
</style>
