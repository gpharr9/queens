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
    <img :src="queen" class="queen-icon" />
    <div class="size-buttons">
      <button
        v-for="s in availableSizes"
        :key="s"
        @click="selectSize(s)"
        class="size-button"
      >
        {{ s }} x {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.main-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  min-height: 100vh;
  justify-content: center;
  background: #fff; /* White background */
  color: #000;      /* Black text */
}

.queen-icon {
  width: 40rem;      /* set width to 8rem */
  height: 40rem;     /* set height to 8rem to keep it square */
  user-select: none;
  filter: drop-shadow(0 0 5px #b29ddb88);
  transition: transform 0.3s ease;
  object-fit: contain; /* keep aspect ratio, no distortion */
  display: inline-block; /* treat as block-level for sizing */
}

.queen-icon:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  color: #111; /* almost black */
  user-select: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-transform: lowercase;
  letter-spacing: 0.15em;
  text-shadow: none; /* Remove color glow for clean B&W vibe */
}

.size-button {
  background: #000; /* Black */
  border: 2px solid #b29ddb; /* Lilac border */
  color: #b29ddb;  /* Lilac text */
  padding: 0.7rem 1.5rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.size-button:hover {
  background: #b29ddb; /* Lilac background */
  color: #fff;         /* White text */
}

.size-button.active {
  background: #b29ddb;
  color: #fff;
  box-shadow: 0 0 12px 3px #a188dbcc;
}
</style>
