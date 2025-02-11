<template>
  <div class="cnn-clone">
    <header class="cnn-header">
      <div class="header-content">
        <h1>US Government News Feed</h1>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Seal_of_the_President_of_the_United_States.svg/800px-Seal_of_the_President_of_the_United_States.svg.png" 
          alt="Presidential Seal" 
          class="presidential-seal"
        />
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

    <!-- Rest of the template remains unchanged -->

  </div>
</template>

<script setup lang="ts">
// Script section remains unchanged
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
}

.header-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 80px;
}

.header-content h1 {
  margin: 0;
  text-align: center;
  flex: 1;
  font-size: 2em;
}

.presidential-seal {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
  transition: all 0.3s ease;
}

.presidential-seal:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

.search-bar {
  margin: 15px auto;
  max-width: 600px;
  width: 100%;
}

.search-bar input {
  width: 100%;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  background-color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.search-bar input:focus {
  outline: none;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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

/* Rest of the existing styles remain unchanged */

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

@media (max-width: 768px) {
  .header-content {
    padding: 0 50px;
  }

  .presidential-seal {
    width: 50px;
    height: 50px;
  }

  .header-content h1 {
    font-size: 1.8em;
  }

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

@media (max-width: 480px) {
  .header-content {
    padding: 0 40px;
  }

  .presidential-seal {
    width: 40px;
    height: 40px;
  }

  .header-content h1 {
    font-size: 1.5em;
  }

  .search-bar input {
    font-size: 14px;
    padding: 10px 16px;
  }
}
</style>
