<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card" style="padding: 1rem; border: 1px solid #ccc; border-radius: 0.5rem; margin-bottom: 1rem;">
    <button type="button" @click="count++" style="background-color: #3182ce; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p style="margin-bottom: 1rem;">
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      style="color: #3182ce; text-decoration: none;"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p style="margin-bottom: 1rem;">
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      style="color: #3182ce; text-decoration: none;"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs" style="color: #888;">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
