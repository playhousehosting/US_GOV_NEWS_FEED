<template>
  <div class="cnn-clone" :class="{ 'dark-mode': isDarkMode }">
    <header class="cnn-header">
      <div class="header-content">
        <h1>US Government News Feed</h1>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Seal_of_the_President_of_the_United_States.svg/800px-Seal_of_the_President_of_the_United_States.svg.png"
          alt="Presidential Seal"
          class="presidential-seal"
        />
        <button @click="toggleDarkMode" class="theme-toggle" aria-label="Toggle dark mode">
          <span v-if="isDarkMode">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
      <div class="search-bar">
        <input 
          type="search" 
          v-model="searchQuery" 
          placeholder="Search articles..."
          @input="onSearch"
        />
        <div v-if="searchQuery" class="search-stats">
          Found {{ store.searchResults.total }} results:
          <span v-if="store.searchResults.byType.rss > 0">
            {{ store.searchResults.byType.rss }} RSS articles
          </span>
          <span v-if="store.searchResults.byType.executive_order > 0">
            {{ store.searchResults.byType.executive_order }} Executive Orders
          </span>
        </div>
      </div>
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
                  <div class="cnn-actions">
                    <button
                      @click="toggleBookmark(article)"
                      class="bookmark-btn"
                      :class="{ 'bookmarked': isBookmarked(article) }"
                      :aria-label="isBookmarked(article) ? 'Remove from bookmarks' : 'Add to bookmarks'"
                    >
                      <span v-if="isBookmarked(article)">★</span>
                      <span v-else>☆</span>
                    </button>
                    <a :href="article.link" target="_blank" class="cnn-read-more">Read more</a>
                  </div>
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
                  <div class="cnn-actions">
                    <button
                      @click="toggleBookmark(article)"
                      class="bookmark-btn"
                      :class="{ 'bookmarked': isBookmarked(article) }"
                      :aria-label="isBookmarked(article) ? 'Remove from bookmarks' : 'Add to bookmarks'"
                    >
                      <span v-if="isBookmarked(article)">★</span>
                      <span v-else>☆</span>
                    </button>
                    <a :href="article.link" target="_blank" class="cnn-read-more">Read more</a>
                  </div>
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
        
        <div class="bookmarks-section" v-if="bookmarks.length > 0">
          <h2>Bookmarks</h2>
          <ul class="bookmarks-list">
            <li v-for="bookmark in bookmarkedArticles" :key="bookmark.link">
              <a :href="bookmark.link" target="_blank" class="bookmark-link">
                {{ bookmark.title }}
              </a>
              <button
                @click="toggleBookmark(bookmark)"
                class="remove-bookmark-btn"
                aria-label="Remove from bookmarks"
              >
                ✕
              </button>
            </li>
          </ul>
        </div>

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
import { ref, computed, onMounted, watch } from 'vue';
import { useNewsStore } from '../store';

const store = useNewsStore();
const currentPage = ref(1);
const itemsPerPage = 12;
const searchQuery = ref('');
const isDarkMode = ref(false);
const bookmarks = ref<string[]>([]);

onMounted(async () => {
  await store.fetchNews();
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    document.body.classList.add('dark-mode');
  }
  
  // Load bookmarks from localStorage
  const savedBookmarks = localStorage.getItem('bookmarks');
  if (savedBookmarks) {
    try {
      bookmarks.value = JSON.parse(savedBookmarks);
    } catch (e) {
      console.error('Error loading bookmarks:', e);
    }
  }
});

// Toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }
};

// Debounce search to avoid too many updates
let searchTimeout: number | null = null;
const onSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = window.setTimeout(() => {
    store.setSearchQuery(searchQuery.value);
    currentPage.value = 1;
  }, 300);
};

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

// Bookmarked articles
const bookmarkedArticles = computed(() => {
  return store.news.filter(article => bookmarks.value.includes(article.link));
});

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

// Bookmark functionality
const toggleBookmark = (article: any) => {
  const articleId = article.link;
  const index = bookmarks.value.indexOf(articleId);
  
  if (index === -1) {
    // Add to bookmarks
    bookmarks.value.push(articleId);
  } else {
    // Remove from bookmarks
    bookmarks.value.splice(index, 1);
  }
  
  // Save to localStorage
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value));
};

const isBookmarked = (article: any): boolean => {
  return bookmarks.value.includes(article.link);
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Dark Mode Styles */
.dark-mode {
  background-color: #121212;
  color: #e0e0e0;
}

.theme-toggle {
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.cnn-header {
  background-color: #cc0000;
  color: #fff;
  padding: 20px;
}

.header-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  gap: 15px;
}

.header-content h1 {
  margin: 0;
  text-align: center;
  font-size: 1.8em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.presidential-seal {
  width: 45px;
  height: 45px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 2px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.presidential-seal:hover {
  opacity: 1;
  transform: scale(1.1);
}

.search-bar {
  margin: 15px auto;
  max-width: 100%;
  width: 100%;
  padding: 0 20px;
}

.search-bar input {
  width: 100%;
  padding: 10px 15px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  color: #333;
}

.search-bar input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background-color: white;
}

.dark-mode .search-bar input {
  background-color: rgba(30, 30, 30, 0.9);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .search-bar input:focus {
  background-color: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.3);
}

.search-stats {
  margin-top: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.search-stats span {
  margin: 0 10px;
  padding: 2px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
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
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.cnn-content {
  flex: 2;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #666;
  transition: color 0.3s ease;
}

.dark-mode .loading, .dark-mode .no-results {
  color: #d0d0d0;
}

.error {
  color: #cc0000;
}

.dark-mode .error {
  color: #ff6666;
}

.no-results {
  font-style: italic;
}

.executive-orders-grid {
  display: grid;
  gap: 15px;
  margin-top: 15px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.executive-order {
  border: none;
  padding: 15px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
}

.executive-order:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.dark-mode .executive-order {
  background-color: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark-mode .executive-order:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.order-header h3 {
  margin: 0;
  flex: 1;
  font-size: 1.1em;
  line-height: 1.4;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.pending_publication {
  background-color: #fff3cd;
  color: #856404;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dark-mode .status-badge.pending_publication {
  background-color: #3a3000;
  color: #ffd54f;
}

.status-badge.published {
  background-color: #d4edda;
  color: #155724;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dark-mode .status-badge.published {
  background-color: #0a3622;
  color: #4caf50;
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
  transition: color 0.3s ease;
}

.dark-mode .meta-label {
  color: #d0d0d0;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.cnn-stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.cnn-top-story, .cnn-story {
  border: none;
  padding: 15px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cnn-top-story:hover, .cnn-story:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.dark-mode .cnn-top-story, .dark-mode .cnn-story {
  background-color: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark-mode .cnn-top-story:hover, .dark-mode .cnn-story:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.cnn-top-story.featured {
  grid-column: 1 / -1;
}

.cnn-top-story-image, .cnn-story-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #f0f0f0;
}

.cnn-category {
  display: inline-block;
  background-color: #f8f9fa;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  margin-bottom: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dark-mode .cnn-category {
  background-color: #2c2c2c;
  color: #e0e0e0;
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
  transition: color 0.3s ease;
}

.dark-mode .cnn-content {
  color: #d0d0d0;
}

.cnn-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.cnn-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bookmark-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  color: #ccc;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, transform 0.2s ease;
}

.bookmark-btn:hover {
  color: #ffb700;
  transform: scale(1.1);
}

.bookmark-btn.bookmarked {
  color: #ffb700;
}

.dark-mode .bookmark-btn {
  color: #666;
}

.dark-mode .bookmark-btn:hover {
  color: #ffb700;
}

.dark-mode .bookmark-btn.bookmarked {
  color: #ffb700;
}

.cnn-date {
  color: #666;
  font-size: 0.9em;
  transition: color 0.3s ease;
}

.dark-mode .cnn-date {
  color: #d0d0d0;
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

.dark-mode .cnn-read-more {
  color: #ff6666;
}

.dark-mode .cnn-read-more:hover {
  color: #ff8888;
}

.cnn-sidebar {
  flex: 1;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 20px;
  max-width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.dark-mode .cnn-sidebar {
  background-color: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.cnn-categories {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cnn-categories li {
  padding: 10px 15px;
  margin: 3px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.95em;
}

.cnn-categories li:hover {
  background-color: #f8f9fa;
}

.dark-mode .cnn-categories li:hover {
  background-color: #2c2c2c;
}

.cnn-categories li.active {
  background-color: #cc0000;
  color: #fff;
  font-weight: 500;
}

.bookmarks-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  transition: border-color 0.3s ease;
}

.dark-mode .bookmarks-section {
  border-top-color: #444;
}

.bookmarks-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
}

.bookmarks-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  border-radius: 4px;
  background-color: #f8f9fa;
  transition: background-color 0.3s ease;
}

.dark-mode .bookmarks-list li {
  background-color: #2c2c2c;
}

.bookmark-link {
  color: #333;
  text-decoration: none;
  font-size: 0.9em;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.dark-mode .bookmark-link {
  color: #e0e0e0;
}

.bookmark-link:hover {
  color: #cc0000;
}

.dark-mode .bookmark-link:hover {
  color: #ff6666;
}

.remove-bookmark-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.9em;
  padding: 0 0 0 8px;
  transition: color 0.2s ease;
}

.remove-bookmark-btn:hover {
  color: #cc0000;
}

.dark-mode .remove-bookmark-btn {
  color: #777;
}

.dark-mode .remove-bookmark-btn:hover {
  color: #ff6666;
}

.cnn-stats {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  transition: border-color 0.3s ease;
}

.dark-mode .cnn-stats {
  border-top-color: #444;
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
  transition: color 0.3s ease;
}

.dark-mode .page-info {
  color: #d0d0d0;
}

.cnn-footer {
  text-align: center;
  padding: 20px;
  background-color: #333;
  color: #fff;
  margin-top: auto;
  transition: background-color 0.3s ease;
}

.dark-mode .cnn-footer {
  background-color: #1a1a1a;
}

@media (max-width: 1200px) {
  .header-content {
    padding: 0 60px;
  }

  .cnn-top-stories-grid {
    grid-template-columns: 1fr;
  }

  .cnn-top-story.featured {
    grid-column: auto;
  }
}

@media (max-width: 1024px) {
  .cnn-main {
    padding: 15px;
  }
  
  .cnn-top-stories-grid,
  .cnn-stories-grid,
  .executive-orders-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
    flex-direction: column;
    gap: 10px;
  }

  .presidential-seal {
    width: 40px;
    height: 40px;
    order: -1; /* Move seal above title */
  }

  .header-content h1 {
    font-size: 1.4em;
    text-align: center;
    max-width: 100%;
  }

  .type-filter, .status-filter {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0 15px;
    justify-content: center;
  }

  .type-filter button, .status-filter button {
    flex: 0 1 auto;
    min-width: 120px;
    text-align: center;
  }

  .cnn-main {
    flex-direction: column;
    padding: 10px;
  }

  .cnn-sidebar {
    position: static;
    margin: 15px 0;
    max-width: none;
  }

  .cnn-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .cnn-categories li {
    flex: 0 1 auto;
    min-width: 120px;
    text-align: center;
  }

  .order-meta {
    grid-template-columns: 1fr;
  }

  .meta-item {
    flex-direction: column;
    gap: 4px;
  }

  .meta-label {
    min-width: auto;
    color: #888;
    font-size: 0.9em;
  }

  .order-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }

  .btn {
    text-align: center;
    width: 100%;
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 10px;
    gap: 8px;
  }

  .presidential-seal {
    width: 35px;
    height: 35px;
    border-width: 1.5px;
  }

  .header-content h1 {
    font-size: 1.2em;
    padding: 0 5px;
    letter-spacing: -0.3px;
  }

  .search-bar {
    padding: 0 10px;
  }

  .search-bar input {
    font-size: 14px;
    padding: 8px 12px;
  }

  .type-filter, .status-filter {
    padding: 0 10px;
  }

  .type-filter button, .status-filter button {
    min-width: 100px;
    padding: 6px 10px;
    font-size: 0.9em;
  }

  .cnn-categories li {
    min-width: 100px;
    padding: 8px 12px;
    font-size: 0.9em;
  }
}
</style>
