<script setup>
import { ref } from 'vue'
import moveSoundUrl from '../assets/move.mp3'
import errorBloob from '../assets/error bloop.mp3'
import winSoundUrl from '../assets/win bloop.mp3'

const availableSizes = [6, 8, 12]

const size = ref(null)  // null means no game started yet
const board = ref(null)
const moveHistory = ref([])
const blockColors = ref(null)
const winMessage = ref('')
const invalidQueens = ref(new Set())
const showingSolution = ref(false)

// Sounds
const placeSound = new Audio(moveSoundUrl)
const winSound = new Audio(winSoundUrl)
const invalidSound = new Audio(errorBloob)

function playPlaceSound() {
  placeSound.currentTime = 0
  placeSound.play()
}

function playWinSound() {
  winSound.currentTime = 0
  winSound.play()
}

function playInvalidSound() {
  invalidSound.currentTime = 0;
  invalidSound.play();
}

function checkWin() {
  if (!board.value) {
    winMessage.value = ''
    invalidQueens.value.clear()
    return
  }

  let queenCount = 0
  invalidQueens.value.clear()

  for (let r = 0; r < size.value; r++) {
    for (let c = 0; c < size.value; c++) {
      if (board.value[r][c] === 'Q') {
        queenCount++

        const key = `${r},${c}`

        // Row conflicts
        for (let cc = 0; cc < size.value; cc++) {
          if (cc !== c && board.value[r][cc] === 'Q') {
            invalidQueens.value.add(key)
            invalidQueens.value.add(`${r},${cc}`)
            playInvalidSound() 
          }
        }

        // Column conflicts
        for (let rr = 0; rr < size.value; rr++) {
          if (rr !== r && board.value[rr][c] === 'Q') {
            invalidQueens.value.add(key)
            invalidQueens.value.add(`${rr},${c}`)
            playInvalidSound() 
          }
        }

        // Block conflicts
        const block = blockColors.value[r][c]
        for (let rr = 0; rr < size.value; rr++) {
          for (let cc = 0; cc < size.value; cc++) {
            if ((rr !== r || cc !== c) && board.value[rr][cc] === 'Q' && blockColors.value[rr][cc] === block) {
              invalidQueens.value.add(key)
              invalidQueens.value.add(`${rr},${cc}`)
              playInvalidSound() 
              
            }
          }
        }

        // Adjacent diagonals only
        const adjacentDiags = [
          [r - 1, c - 1],
          [r - 1, c + 1],
          [r + 1, c - 1],
          [r + 1, c + 1]
        ]

        adjacentDiags.forEach(([rr, cc]) => {
          if (rr >= 0 && rr < size.value && cc >= 0 && cc < size.value) {
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

  if (queenCount === size.value && invalidQueens.value.size === 0) {
    if (!winMessage.value) {
      playWinSound()
    }
    winMessage.value = 'You Win!'
  } else {
    winMessage.value = ''
  }
}

function generateConnectedRandomBlocks(sizeInput, blockCount = sizeInput) {
  const totalCells = sizeInput * sizeInput
  const allCells = []
  for (let row = 0; row < sizeInput; row++) {
    for (let col = 0; col < sizeInput; col++) {
      allCells.push({ row, col })
    }
  }
  const shuffled = allCells.sort(() => Math.random() - 0.5)
  const blocks = Array.from({ length: blockCount }, () => [])
  const blockFrontiers = []

  for (let i = 0; i < blockCount; i++) {
    const cell = shuffled.pop()
    blocks[i].push(cell)
    blockFrontiers.push([cell])
  }

  const assigned = new Set(blocks.flat().map(c => `${c.row},${c.col}`))

  while (assigned.size < totalCells) {
    const blockIndex = Math.floor(Math.random() * blockCount)
    const frontier = blockFrontiers[blockIndex]
    if (frontier.length === 0) continue
    const current = frontier[Math.floor(Math.random() * frontier.length)]
    const neighbors = getNeighbors(current.row, current.col, sizeInput).filter(({ row, col }) => !assigned.has(`${row},${col}`))
    if (neighbors.length === 0) {
      frontier.splice(frontier.indexOf(current), 1)
      continue
    }
    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)]
    blocks[blockIndex].push(chosen)
    frontier.push(chosen)
    assigned.add(`${chosen.row},${chosen.col}`)
  }

  const colorPalette = [
    'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'cyan', 'gray', 'lime', 'brown', 'gold'
  ]
  const blockColorMap = {}
  blocks.forEach((block, i) => {
    blockColorMap[i] = colorPalette[i % colorPalette.length]
  })

  const blockMatrix = Array.from({ length: sizeInput }, () => Array(sizeInput).fill(null))
  blocks.forEach((block, blockIndex) => {
    block.forEach(({ row, col }) => {
      blockMatrix[row][col] = blockColorMap[blockIndex]
    })
  })

  return blockMatrix
}

function getNeighbors(row, col, sizeInput) {
  const candidates = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 }
  ]
  return candidates.filter(({ row, col }) =>
    row >= 0 && row < sizeInput && col >= 0 && col < sizeInput
  )
}

function generateEmptyBoard(sizeInput) {
  return Array(sizeInput)
    .fill(null)
    .map(() => Array(sizeInput).fill(null))
}

function toggleQueen(row, col) {
  if (!board.value || showingSolution.value) return
  moveHistory.value.push(structuredClone(board.value))
  board.value[row][col] = board.value[row][col] === 'Q' ? null : 'Q'
  playPlaceSound()
  checkWin()
}

function undo() {
  if (moveHistory.value.length > 0) {
    board.value = moveHistory.value.pop()
    checkWin()
  }
}

function solveQueensWithBlocks(sizeInput, blockMatrix) {
  const solution = Array.from({ length: sizeInput }, () => Array(sizeInput).fill(null));
  const usedColumns = new Set();
  const usedBlocks = new Set();
  const usedDiag1 = new Set(); // r - c
  const usedDiag2 = new Set(); // r + c

  function isSafe(row, col) {
    const blockColor = blockMatrix[row][col];
    return (
      !usedColumns.has(col) &&
      !usedBlocks.has(blockColor) &&
      !usedDiag1.has(row - col) &&
      !usedDiag2.has(row + col)
    );
  }

  function placeQueen(row) {
    if (row === sizeInput) {
      return true;
    }

    for (let col = 0; col < sizeInput; col++) {
      if (isSafe(row, col)) {
        solution[row][col] = 'Q';
        usedColumns.add(col);
        usedBlocks.add(blockMatrix[row][col]);
        usedDiag1.add(row - col);
        usedDiag2.add(row + col);

        if (placeQueen(row + 1)) {
          return true;
        }

        // backtrack
        solution[row][col] = null;
        usedColumns.delete(col);
        usedBlocks.delete(blockMatrix[row][col]);
        usedDiag1.delete(row - col);
        usedDiag2.delete(row + col);
      }
    }
    return false;
  }

  const success = placeQueen(0);
  return success ? solution : null;
}

function generateWinnableGame(selectedSize) {
  let blockMatrix, solution;

  // Loop until a solvable block configuration is found
  do {
    blockMatrix = generateConnectedRandomBlocks(selectedSize);
    solution = solveQueensWithBlocks(selectedSize, blockMatrix);
  } while (!solution);

  // Set reactive states
  blockColors.value = blockMatrix;
  board.value = generateEmptyBoard(selectedSize);
  moveHistory.value = [];
  winMessage.value = '';
  invalidQueens.value.clear();
  showingSolution.value = false;
}

function startGame(selectedSize) {
  size.value = selectedSize;
  generateWinnableGame(selectedSize);
}

function showSolution() {
  if (!size.value) return
  const solution = solveQueensWithBlocks(size.value, blockColors.value)
  if (solution) {
    // Save current board in history before showing solution so user can come back
    moveHistory.value.push(structuredClone(board.value))
    
    // Deep clone to ensure reactivity
    board.value = solution.map(row => [...row])
    invalidQueens.value.clear()
    winMessage.value = ''
    showingSolution.value = true
  } else {
    alert('No solution found for this board!')
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

</script>

<template>
  <div class="p-4">
    <!-- Show main screen if game not started -->
    <div v-if="!size" class="main-screen">
      <div class="queen-icon">♛</div>
      <h1 class="title">queems</h1>
      <div class="size-buttons">
        <button
          v-for="s in availableSizes"
          :key="s"
          @click="startGame(s)"
          class="size-button"
        >
          {{ s }} x {{ s }}
        </button>
      </div>
    </div>

    <!-- Show game UI when started -->
    <div v-else>
      <div class="size-buttons new-game-buttons">
        <button
          v-for="s in availableSizes"
          :key="s"
          @click="startGame(s)"
          :class="['size-button', { active: size === s }]"
        >
          {{ s }} x {{ s }}
        </button>
      </div>

      <div
        v-if="board"
        class="grid"
        :style="`grid-template-columns: repeat(${size}, 1fr); grid-template-rows: repeat(${size}, 1fr);`"
      >
        <div
          v-for="idx in size * size"
          :key="idx"
          class="cell"
          :class="{
            invalid: invalidQueens.has(`${Math.floor((idx - 1) / size)},${(idx - 1) % size}`),
            'queen-placed': board[Math.floor((idx - 1) / size)][(idx - 1) % size] === 'Q'
          }"
          :style="{
            backgroundColor: blockColors[Math.floor((idx - 1) / size)][(idx - 1) % size]
          }"
          @click="toggleQueen(Math.floor((idx - 1) / size), (idx - 1) % size)"
        >
          {{ board[Math.floor((idx - 1) / size)][(idx - 1) % size] === 'Q' ? '♛' : '' }}
        </div>
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


      <div v-if="winMessage" class="win-message">{{ winMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.p-4 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.main-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.queen-icon {
  font-size: 8rem;
  color: rebeccapurple;
  user-select: none;
  filter: drop-shadow(0 0 5px rebeccapurple);
  transition: transform 0.3s ease;
}

.queen-icon:hover {
  transform: scale(1.1);
  cursor: pointer;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  color: rebeccapurple;
  user-select: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-transform: lowercase;
  letter-spacing: 0.15em;
  text-shadow: 0 0 8px rebeccapurple;
}

.size-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 1rem;
}

.new-game-buttons {
  margin-bottom: 1.5rem;
}

.size-button {
  background: linear-gradient(135deg, #7b2ff7, #f107a3);
  border: none;
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 1.25rem;
  box-shadow: 0 3px 7px rgba(123, 47, 247, 0.6);
  cursor: pointer;
  user-select: none;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.size-button:hover {
  background: linear-gradient(135deg, #f107a3, #7b2ff7);
  box-shadow: 0 6px 15px rgba(241, 7, 163, 0.8);
}

.size-button.active {
  box-shadow: 0 0 18px 4px #f107a3;
  background: linear-gradient(135deg, #f107a3, #7b2ff7);
}

.undo-button,
.solution-button {
  background: #ff4551;
  border: none;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 3px 6px rgba(255, 69, 81, 0.7);
  cursor: pointer;
  user-select: none;
  margin: 0 0.5rem;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.undo-button:hover,
.solution-button:hover {
  background: #ff2a3b;
  box-shadow: 0 6px 12px rgba(255, 42, 59, 0.9);
}

.action-buttons {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  user-select: none;
}

.grid {
  display: grid;
  gap: 0;
  width: 90vmin;
  max-width: 600px;
  max-height: 600px;
  aspect-ratio: 1 / 1;
  user-select: none;
  margin-top: 1rem;
}

.cell {
  border: 1px solid black;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 4vmin;
  font-weight: bold;
  color: darkred;
  transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
}

.cell:hover {
  background-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 8px 2px rgba(255, 100, 100, 0.6);
  transform: scale(1.05);
}

.invalid {
  box-shadow: 0 0 10px 4px rgba(255, 0, 0, 0.9);
  border-color: red !important;
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

.win-message {
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: green;
  text-shadow: 0 0 5px #4caf50;
  user-select: none;
  text-align: center;
}
</style>
