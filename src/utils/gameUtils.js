// utils/gameUtils.js

export function generateSolvableBlocks(sizeInput) {
    const queenPositions = solveNQueensClassic(sizeInput);
    if (!queenPositions) {
      throw new Error("Could not solve standard N queens");
    }
  
    // initialize block groups seeded with queen cells
    const blocks = queenPositions.map((col, row) => [{ row, col }]);
    const assigned = new Set(blocks.flat().map(c => `${c.row},${c.col}`));
    const frontiers = blocks.map(block => [...block]);
  
    while (assigned.size < sizeInput * sizeInput) {
      for (let i = 0; i < blocks.length; i++) {
        if (frontiers[i].length === 0) continue;
  
        const current = frontiers[i][Math.floor(Math.random() * frontiers[i].length)];
        const neighbors = getNeighbors(current.row, current.col, sizeInput).filter(({ row, col }) => !assigned.has(`${row},${col}`));
        if (neighbors.length === 0) {
          frontiers[i] = frontiers[i].filter(c => c !== current);
          continue;
        }
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        blocks[i].push(chosen);
        frontiers[i].push(chosen);
        assigned.add(`${chosen.row},${chosen.col}`);
      }
    }
  
    const pastelPalette = [
      "#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA", "#FFDFBA",
      "#D7BAFF", "#F0E68C", "#AFEEEE", "#FFC0CB", "#E6E6FA"
    ];
    const blockColorMap = {};
    blocks.forEach((block, i) => {
      blockColorMap[i] = pastelPalette[i % pastelPalette.length];
    });
  
    const blockMatrix = Array.from({ length: sizeInput }, () => Array(sizeInput).fill(null));
    blocks.forEach((block, blockIndex) => {
      block.forEach(({ row, col }) => {
        blockMatrix[row][col] = blockColorMap[blockIndex];
      });
    });
  
    // convert queen positions to board matrix
    const queenBoard = generateEmptyBoard(sizeInput);
    queenPositions.forEach((col, row) => {
      queenBoard[row][col] = "Q";
    });
  
    return { blockMatrix, solution: queenBoard };
  }
  
  export function solveNQueensClassic(sizeInput) {
    const solution = [];
    const usedCols = new Set();
    const usedDiag1 = new Set();
    const usedDiag2 = new Set();
    function place(row) {
      if (row === sizeInput) return true;
      for (let col = 0; col < sizeInput; col++) {
        if (
          !usedCols.has(col) &&
          !usedDiag1.has(row - col) &&
          !usedDiag2.has(row + col)
        ) {
          solution[row] = col;
          usedCols.add(col);
          usedDiag1.add(row - col);
          usedDiag2.add(row + col);
          if (place(row + 1)) return true;
          usedCols.delete(col);
          usedDiag1.delete(row - col);
          usedDiag2.delete(row + col);
        }
      }
      return false;
    }
    return place(0) ? solution : null;
  }
  
  export function generateEmptyBoard(sizeInput) {
    return Array(sizeInput)
      .fill(null)
      .map(() => Array(sizeInput).fill(null));
  }
  
  function getNeighbors(row, col, sizeInput) {
    return [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    ].filter(({ row, col }) => row >= 0 && row < sizeInput && col >= 0 && col < sizeInput);
  }
  