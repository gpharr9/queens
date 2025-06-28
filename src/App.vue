<script setup>
import { ref } from 'vue'
import MainScreen from "./components/MainScreen.vue"
import GameScreen from './components/GameScreen.vue'

const currentSize = ref(null)

function startGame(size) {
  currentSize.value = size
}

function exitGame() {
  currentSize.value = null
}
</script>

<template>
  <div id="app">
    <MainScreen v-if="!currentSize" @start-game="startGame" />
    <GameScreen v-else :size="currentSize" @exit-game="exitGame" />
  </div>
</template>

<style>
/* Global styles if needed */
body, html, #app {
  margin: 0;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f9f9f9;
  color: #222;
}
</style>
