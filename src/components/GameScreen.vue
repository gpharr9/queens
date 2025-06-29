<script setup>
import { ref, watch, defineProps, defineEmits, computed, nextTick } from 'vue'
import { generateSolvableBlocks, generateEmptyBoard } from '../utils/gameUtils.js'

import standardQueen from '../assets/white-queen.png'
import errorQueen from '../assets/error-queen.png'

import confetti from 'canvas-confetti'

const props = defineProps({ size: Number })
const emit = defineEmits(['exit-game'])

const board = ref(null)
const blockColors = ref(null)
const moveHistory = ref([])
const winMessage = ref('')
const invalidQueens = ref(new Set())
const invalidBlocks = computed(() => {
  if (!board.value || !blockColors.value) return new Set()
  const blocks = new Set()
  invalidQueens.value.forEach(q => {
    const [r, c] = q.split(',').map(Number)
    blocks.add(blockColors.value[r][c])
  })
  return blocks
})
const showingSolution = ref(false)
let bakedSolution = null
const showConfetti = ref(false)
const confettiCanvas = ref(null)

// Audio
import moveSoundUrl from '../assets/move.mp3'
import errorBloopUrl from '../assets/error bloop.mp3'
import winSoundUrl from '../assets/win bloop.mp3'
import startSoundUrl from '../assets/start.mp3'

const placeSound = new Audio(moveSoundUrl)
const winSound = new Audio(winSoundUrl)
const invalidSound = new Audio(errorBloopUrl)
const startSound = new Audio(startSoundUrl)

function playPlaceSound() {
  placeSound.currentTime = 0
  placeSound.play()
}
function playWinSound() {
  winSound.currentTime = 0
  winSound.play()
}
function playInvalidSound() {
  invalidSound.currentTime = 0
  invalidSound.play()
}
function playStartSound() {
  startSound.currentTime = 0
  startSound.play()
}

function startNewGame(selectedSize) {
  const { blockMatrix, solution } = generateSolvableBlocks(selectedSize)
  blockColors.value = blockMatrix
  bakedSolution = solution
  board.value = generateEmptyBoard(selectedSize)
  moveHistory.value = []
  winMessage.value = ''
  invalidQueens.value.clear()
  showingSolution.value = false
  showConfetti.value = false
  playStartSound()
}

watch(() => props.size, (newSize) => {
  if (newSize) startNewGame(newSize)
}, { immediate: true })

async function triggerConfetti() {
  showConfetti.value = true
  await nextTick()

  const canvas = confettiCanvas.value
  if (canvas && typeof canvas.getBoundingClientRect === 'function') {
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
    myConfetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#55efc4', '#00b894', '#00cec9', '#81ecec', '#a29bfe'],
    })
    setTimeout(() => {
      showConfetti.value = false
    }, 4000)
  } else {
    showConfetti.value = false
  }
}

function checkWin() {
  if (!board.value) return

  invalidQueens.value.clear()
  let queenCount = 0

  for (let r = 0; r < props.size; r++) {
    for (let c = 0; c < props.size; c++) {
      if (board.value[r][c] === 'Q') {
        queenCount++
        const key = `${r},${c}`

        // Row/col conflicts
        for (let cc = 0; cc < props.size; cc++) {
          if (cc !== c && board.value[r][cc] === 'Q') {
            invalidQueens.value.add(key)
            invalidQueens.value.add(`${r},${cc}`)
            playInvalidSound()
          }
        }
        for (let rr = 0; rr < props.size; rr++) {
          if (rr !== r && board.value[rr][c] === 'Q') {
            invalidQueens.value.add(key)
            invalidQueens.value.add(`${rr},${c}`)
            playInvalidSound()
          }
        }
        // Block conflicts
        const block = blockColors.value[r][c]
        for (let rr = 0; rr < props.size; rr++) {
          for (let cc = 0; cc < props.size; cc++) {
            if ((rr !== r || cc !== c) && board.value[rr][cc] === 'Q' && blockColors.value[rr][cc] === block) {
              invalidQueens.value.add(key)
              invalidQueens.value.add(`${rr},${cc}`)
              playInvalidSound()
            }
          }
        }
        // Adjacent diagonals
        [[r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]].forEach(([rr,cc]) => {
          if (rr>=0 && rr<props.size && cc>=0 && cc<props.size) {
            if (board.value[rr][cc] === 'Q') {
              invalidQueens.value.add(key)
              invalidQueens.value.add(`${rr},${cc}`)
              playInvalidSound()
            }
          }
        })
      }
    }
  }
  if (queenCount === props.size && invalidQueens.value.size === 0) {
    if (!winMessage.value) {
      playWinSound()
      triggerConfetti()
    }
    winMessage.value = 'You Win!'
  } else {
    winMessage.value = ''
    showConfetti.value = false
  }
}

function toggleQueen(row, col) {
  if (!board.value || showingSolution.value) return
  moveHistory.value.push(structuredClone(board.value))
  board.value[row][col] = board.value[row][col] === 'Q' ? null : 'Q'
  playPlaceSound()
  checkWin()
}

function undo() {
  if (moveHistory.value.length > 0 && !showingSolution.value) {
    board.value = moveHistory.value.pop()
    checkWin()
  }
}

function showSolution() {
  if (bakedSolution) {
    moveHistory.value.push(structuredClone(board.value))
    board.value = structuredClone(bakedSolution)
    invalidQueens.value.clear()
    winMessage.value = ''
    showingSolution.value = true
  }
}

function hideSolution() {
  if (moveHistory.value.length > 0) {
    board.value = moveHistory.value.pop()
    invalidQueens.value.clear()
    winMessage.value = ''
    showingSolution.value = false
  }
}

function exitGame() {
  emit('exit-game')
}
</script>

<template>
  <div class="game-screen">
    <canvas v-show="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
    <div class="animated-background"></div>
    <div class="game-content">
      <div class="game-header">
        <div class="top-buttons">
          <button @click="exitGame" class="exit-button">Back to Menu</button>
        </div>
        <div class="action-buttons">
          <button
            v-if="moveHistory.length > 0 && !showingSolution"
            @click="undo"
            class="undo-button"
          >
            Undo
          </button>
          <button
            v-if="!showingSolution"
            @click="showSolution"
            class="solution-button"
          >
            Show Solution
          </button>
          <button
            v-if="showingSolution"
            @click="hideSolution"
            class="solution-button"
          >
            Hide Solution
          </button>
        </div>
      </div>

      <transition name="popup">
        <div v-if="winMessage" class="win-message-popup">
          <div class="win-message-text">{{ winMessage }}</div>
          <button class="new-game-button" @click="startNewGame(props.size)">New Game</button>
        </div>
      </transition>

      <div
        v-if="board"
        class="grid"
        :style="`grid-template-columns: repeat(${props.size}, 1fr); grid-template-rows: repeat(${props.size}, 1fr);`"
      >
        <div
          v-for="idx in props.size * props.size"
          :key="idx"
          class="cell"
          :class="{
            invalid: invalidQueens.has(`${Math.floor((idx - 1) / props.size)},${(idx - 1) % props.size}`),
            'queen-placed': board[Math.floor((idx - 1) / props.size)][(idx - 1) % props.size] === 'Q',
            'invalid-block': invalidBlocks.has(blockColors[Math.floor((idx - 1) / props.size)][(idx - 1) % props.size])
          }"
          :style="{
            backgroundColor: blockColors[Math.floor((idx - 1) / props.size)][(idx - 1) % props.size]
          }"
          @click="toggleQueen(Math.floor((idx - 1) / props.size), (idx - 1) % props.size)"
        >
          <span v-if="board[Math.floor((idx - 1) / props.size)][(idx - 1) % props.size] === 'Q' && !invalidQueens.has(`${Math.floor((idx - 1) / props.size)},${(idx - 1) % props.size}`)">
            <img :src="standardQueen" alt="standard queen" style="width: 80%; height: auto; max-height: 80%; object-fit: contain;"/>
          </span>
          <span v-if="invalidQueens.has(`${Math.floor((idx - 1) / props.size)},${(idx - 1) % props.size}`)">
            <img :src="errorQueen" alt="error queen" style="width: 80%; height: auto; max-height: 80%; object-fit: contain;"/>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-screen {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.confetti-canvas {
  position: fixed;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
}

/* Purple vaporwave background restored */
.animated-background {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(135deg, #2a004e 0%, #4b0082 50%, #2c006a 100%);
  background-repeat: no-repeat;
  z-index: 0;
}
.animated-background::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 30%, rgba(255, 110, 196, 0.18) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(142, 45, 226, 0.18) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(65, 224, 240, 0.18) 0%, transparent 50%);
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

.game-content {
  position: relative;
  z-index: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  color: #fff;
}

.game-header {
  width: 90vmin;
  max-width: 600px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.top-buttons,
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.exit-button,
.undo-button,
.solution-button {
  background: linear-gradient(135deg, #c8b5f7, #e3c7f2);
  border: none;
  color: #6a5d8f;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 3px 6px rgba(140, 115, 190, 0.4);
  cursor: pointer;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.exit-button:hover,
.undo-button:hover,
.solution-button:hover {
  background: linear-gradient(135deg, #d3c0f8, #f0dbf9);
  box-shadow: 0 4px 8px rgba(155, 130, 210, 0.5);
}

.grid {
  display: grid;
  gap: 0;
  width: 90vmin;
  max-width: 600px;
  max-height: 600px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  border: 3px solid #000;
}

.cell {
  border: 1.5px solid #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
}

.cell:hover {
  background-color: rgba(180, 160, 210, 0.15);
  box-shadow: 0 0 6px 1px rgba(120, 110, 150, 0.3);
  transform: scale(1.03);
}

.invalid {
  box-shadow: 0 0 10px 4px rgba(255, 100, 100, 0.5);
  border-color: #d17676 !important;
}

.queen-placed {
  animation: queenPop 0.2s ease forwards;
}

@keyframes queenPop {
  0% {
    transform: scale(0.3);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.invalid-block {
  filter: brightness(0.8) saturate(1.2) hue-rotate(-20deg);
}

/* Win popup styling with green vaporwave theme only */
.win-message-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border-radius: 24px;
  box-shadow: 0 0 40px 10px #27ae60cc, 0 0 60px 20px #2ecc7188;
  padding: 2.5rem 4rem;
  text-align: center;
  z-index: 20;
  color: #e0f2f1;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none;
  backdrop-filter: blur(8px);
  border: 2px solid #00c853;
}

.win-message-text {
  font-size: 3rem;
  font-weight: 900;
  text-shadow:
    0 0 8px #00c853,
    0 0 20px #00e676,
    0 0 30px #00e676,
    0 0 40px #00e676;
  margin-bottom: 1.5rem;
}

.new-game-button {
  background: linear-gradient(135deg, #00e676, #00c853);
  border: none;
  color: #004d40;
  padding: 0.85rem 2.5rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.3rem;
  cursor: pointer;
  box-shadow:
    0 8px 15px #00e676cc,
    0 0 10px #00c853cc inset;
  transition: background 0.3s ease, box-shadow 0.3s ease;
  user-select: none;
}

.new-game-button:hover {
  background: linear-gradient(135deg, #00c853, #009624);
  box-shadow:
    0 10px 25px #00c853dd,
    0 0 20px #00701a inset;
}

/* Popup transition */
.popup-enter-active, .popup-leave-active {
  transition: all 0.4s ease;
}
.popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -60%) scale(0.7);
}
.popup-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.popup-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -60%) scale(0.7);
}
</style>
