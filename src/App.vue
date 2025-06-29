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
    <transition name="fade" mode="out-in">
      <MainScreen v-if="!currentSize" @start-game="startGame" key="main" />
      <GameScreen v-else :size="currentSize" @exit-game="exitGame" key="game" />
    </transition>
  </div>
</template>

<style>
/* Set the vaporwave purple background on the whole viewport */
body, html, #app {
  margin: 0;
  height: 100%;
  background: #8a2be2; /* vaporwave purple */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #222;
  overflow: hidden;
}

/* Fade only opacity of screens for smooth transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
  position: relative;
  z-index: 1;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
