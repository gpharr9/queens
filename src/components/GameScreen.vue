<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import { generateSolvableBlocks, generateEmptyBoard } from '../utils/gameUtils.js'

import standardQueen from '../assets/white-queen.png'
import errorQueen from '../assets/error-queen.png'

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
  invalidSound.play();
}
function playStartSound() {
  startSound.currentTime = 0;
  startSound.play();
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
  playStartSound()
}

watch(() => props.size, (newSize) => {
  if (newSize) startNewGame(newSize)
}, { immediate: true })

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
    if (!winMessage.value) playWinSound()
    winMessage.value = 'You Win!'
  } else {
    winMessage.value = ''
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

    <div v-if="winMessage" class="win-message">
      {{ winMessage }}
      <button class="new-game-button" @click="startNewGame(props.size)">New Game</button>
    </div>

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
      <span v-if="board[Math.floor((idx - 1) / props.size)][(idx - 1) % props.size] === 'Q' && !invalidQueens.has(`${Math.floor((idx - 1) / props.size)},${(idx - 1) % props.size}`)"><img :src="standardQueen" alt="standard queen" style="width: 80%; height: auto; max-height: 80%; object-fit: contain;"/></span>
      <span v-if="invalidQueens.has(`${Math.floor((idx - 1) / props.size)},${(idx - 1) % props.size}`)"><img :src="errorQueen" alt="error queen" style="width: 80%; height: auto; max-height: 80%; object-fit: contain;"/></span>
      </div>
    </div>
  </div>
</template>



<style scoped>

.win-message {
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #5a9d68; /* pastel green */
  text-shadow: 0 0 5px #81c78488;
  user-select: none;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.new-game-button {
  background: linear-gradient(135deg, #a8d5a3, #6ca86c);
  border: none;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 3px 6px rgba(92, 138, 92, 0.5);
  width: max-content;
}

.new-game-button:hover {
  background: linear-gradient(135deg, #6ca86c, #4a703c);
  box-shadow: 0 4px 10px rgba(60, 90, 60, 0.7);
}

.invalid-block {
  filter: brightness(0.8) saturate(1.2) hue-rotate(-20deg);
}
.game-screen {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  min-height: 100vh;
  justify-content: center;
  box-sizing: border-box;
  background: #faf8f7;
}

.game-header {
  width: 90vmin;
  max-width: 600px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.top-buttons {
  flex: 1 1 auto;
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
}

.action-buttons {
  flex: 1 1 auto;
  display: flex;
  justify-content: flex-end;
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
  user-select: none;
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
  user-select: none;
  margin-top: 1.5rem;
  background-color: #f4f1f7;
  border-radius: 8px;
  border: 3px solid #000;  /* Black border around entire board */
  box-shadow: none; /* Optional: remove soft shadows for cleaner look */
}

.cell {
  border: 1.5px solid #000; /* Black border on each cell */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* prevents image spillover */
  cursor: pointer;
  font-size: 4vmin;
  font-weight: bold;
  color: #7b6e9d; /* queen color remains lilac-ish */
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
  border: 1.5px solid #000;
  position: relative;
}


.cell:hover {
  background-color: rgba(180, 160, 210, 0.15); /* subtle lilac hover */
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

</style>
