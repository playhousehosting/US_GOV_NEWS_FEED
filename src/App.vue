<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

onMounted(async () => {
  await store.dispatch('fetchNews');
});
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
