<script setup>
import { defineEmits } from 'vue'
import queen from "../assets/entry-queen.png"

const emit = defineEmits(['start-game'])

const availableSizes = [6, 8, 12]

function selectSize(size) {
  emit('start-game', size)
}
</script>

<template>
  <div class="main-screen">
    <div class="animated-background"></div>
    <img :src="queen" class="queen-icon" />
    <div class="size-buttons">
      <button
        v-for="(s, i) in availableSizes"
        :key="s"
        @click="selectSize(s)"
        class="size-button"
        :style="{ animationDelay: `${i * 0.3 + 1}s` }"
      >
        {{ s }} x {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* vaporwave gradient background */
.main-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  min-height: 100vh;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #8e2de2 0%, #ff6ec4 50%, #41e0f0 100%);
  color: #fff;
}

/* more visible vaporwave-inspired blobs */
.animated-background::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 30%, rgba(255, 110, 196, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(142, 45, 226, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(65, 224, 240, 0.3) 0%, transparent 50%);
  animation: moveBackground 20s linear infinite alternate;
  z-index: 0;
}

@keyframes moveBackground {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    transform: translate(10%, 10%) rotate(5deg) scale(1.1);
  }
}

.queen-icon {
  width: 40rem;
  height: 40rem;
  user-select: none;
  filter: drop-shadow(0 0 10px #ff6ec4);
  transition: transform 0.3s ease;
  object-fit: contain;
  display: inline-block;
  animation: fadeDown 1s ease forwards;
  position: relative;
  z-index: 1;
}

.queen-icon:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.size-buttons {
  display: flex;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.size-button {
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #ff6ec4;
  color: #ff6ec4;
  padding: 0.7rem 1.5rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.25s ease, color 0.25s ease;
  opacity: 0;
  transform: scale(0.5);
  animation: popUp 0.4s ease forwards;
}

.size-button:hover {
  background: #ff6ec4;
  color: #fff;
}

.size-button.active {
  background: #ff6ec4;
  color: #fff;
  box-shadow: 0 0 12px 3px #ff6ec4aa;
}

/* fadeDown + popUp reused */
@keyframes fadeDown {
  0% {
    opacity: 0;
    transform: translateY(-50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popUp {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
