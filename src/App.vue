<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNewsStore } from './store';

const store = useNewsStore();

onMounted(async () => {
  await store.fetchNews();
});
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
