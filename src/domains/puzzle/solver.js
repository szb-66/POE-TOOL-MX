export const DIRECTIONS = Object.freeze({ N: 1, E: 2, S: 4, W: 8 })

export const PUZZLE_TYPES = Object.freeze(['endpoint', 'straight', 'corner', 'tee', 'cross'])

export const BOUNDARY_EXITS = Object.freeze([
  { id: 'N0', cell: 0, direction: DIRECTIONS.N },
  { id: 'N1', cell: 1, direction: DIRECTIONS.N },
  { id: 'N2', cell: 2, direction: DIRECTIONS.N },
  { id: 'E0', cell: 2, direction: DIRECTIONS.E },
  { id: 'E1', cell: 5, direction: DIRECTIONS.E },
  { id: 'E2', cell: 8, direction: DIRECTIONS.E },
  { id: 'S0', cell: 6, direction: DIRECTIONS.S },
  { id: 'S1', cell: 7, direction: DIRECTIONS.S },
  { id: 'S2', cell: 8, direction: DIRECTIONS.S },
  { id: 'W0', cell: 0, direction: DIRECTIONS.W },
  { id: 'W1', cell: 3, direction: DIRECTIONS.W },
  { id: 'W2', cell: 6, direction: DIRECTIONS.W }
])

const INTERNAL_EDGES = Object.freeze((() => {
  const edges = []
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const cell = row * 3 + column
      if (column < 2) edges.push({ a: cell, b: cell + 1, aDirection: DIRECTIONS.E, bDirection: DIRECTIONS.W })
      if (row < 2) edges.push({ a: cell, b: cell + 3, aDirection: DIRECTIONS.S, bDirection: DIRECTIONS.N })
    }
  }
  return edges
})())

const popcount = (value) => {
  let count = 0
  for (let bits = value >>> 0; bits; bits &= bits - 1) count += 1
  return count
}

export function typeForMask(mask) {
  const normalized = Number(mask) & 15
  const degree = popcount(normalized)
  if (degree === 1) return 'endpoint'
  if (degree === 2) {
    return normalized === (DIRECTIONS.N | DIRECTIONS.S) || normalized === (DIRECTIONS.E | DIRECTIONS.W)
      ? 'straight'
      : 'corner'
  }
  if (degree === 3) return 'tee'
  if (degree === 4) return 'cross'
  return null
}

export function rotateMask(mask, quarterTurns = 0) {
  let rotated = Number(mask) & 15
  const turns = ((Math.round(Number(quarterTurns) || 0) % 4) + 4) % 4
  for (let index = 0; index < turns; index += 1) {
    rotated = ((rotated << 1) & 15) | ((rotated & DIRECTIONS.W) ? DIRECTIONS.N : 0)
  }
  return rotated
}

export function maskForType(type, orientation = 0) {
  const bases = {
    endpoint: DIRECTIONS.N,
    straight: DIRECTIONS.N | DIRECTIONS.S,
    corner: DIRECTIONS.N | DIRECTIONS.E,
    tee: DIRECTIONS.N | DIRECTIONS.E | DIRECTIONS.W,
    cross: 15
  }
  return rotateMask(bases[type] || 0, Math.round(Number(orientation) / 90))
}

export function orientationForMask(mask) {
  const normalized = Number(mask) & 15
  const variants = {
    endpoint: [DIRECTIONS.N, DIRECTIONS.E, DIRECTIONS.S, DIRECTIONS.W],
    straight: [DIRECTIONS.N | DIRECTIONS.S, DIRECTIONS.E | DIRECTIONS.W],
    corner: [DIRECTIONS.N | DIRECTIONS.E, DIRECTIONS.E | DIRECTIONS.S, DIRECTIONS.S | DIRECTIONS.W, DIRECTIONS.W | DIRECTIONS.N],
    tee: [DIRECTIONS.N | DIRECTIONS.E | DIRECTIONS.W, DIRECTIONS.N | DIRECTIONS.E | DIRECTIONS.S, DIRECTIONS.E | DIRECTIONS.S | DIRECTIONS.W, DIRECTIONS.N | DIRECTIONS.S | DIRECTIONS.W],
    cross: [15]
  }
  const type = typeForMask(normalized)
  const index = variants[type]?.indexOf(normalized) ?? -1
  return index < 0 ? 0 : index * 90
}

function enumerateConnectedInternalMasks() {
  const connected = []
  const combinationCount = 1 << INTERNAL_EDGES.length
  for (let selected = 0; selected < combinationCount; selected += 1) {
    const parent = Array.from({ length: 9 }, (_, index) => index)
    const find = (value) => {
      let root = value
      while (parent[root] !== root) root = parent[root]
      while (parent[value] !== value) {
        const next = parent[value]
        parent[value] = root
        value = next
      }
      return root
    }
    const masks = Array(9).fill(0)
    INTERNAL_EDGES.forEach((edge, index) => {
      if (!(selected & (1 << index))) return
      const leftRoot = find(edge.a)
      const rightRoot = find(edge.b)
      if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot
      masks[edge.a] |= edge.aDirection
      masks[edge.b] |= edge.bDirection
    })
    const root = find(0)
    if (Array.from({ length: 9 }, (_, index) => find(index)).every(value => value === root)) {
      connected.push(Object.freeze(masks))
    }
  }
  return Object.freeze(connected)
}

export const CONNECTED_INTERNAL_MASKS = enumerateConnectedInternalMasks()

const BOUNDARY_MASKS_BY_SCORE = Object.freeze(Array.from({ length: 13 }, (_, score) => (
  Object.freeze(Array.from({ length: 1 << BOUNDARY_EXITS.length }, (_, value) => value)
    .filter(value => popcount(value) === score))
)))

export function countsFromSlots(slots = []) {
  const counts = Object.fromEntries(PUZZLE_TYPES.map(type => [type, 0]))
  for (const slot of slots) {
    if (slot?.occupied && PUZZLE_TYPES.includes(slot.type)) counts[slot.type] += 1
  }
  return counts
}

function normalizeCounts(counts = {}) {
  return Object.fromEntries(PUZZLE_TYPES.map(type => [type, Math.max(0, Math.floor(Number(counts[type]) || 0))]))
}

function boundaryExitMask(exits = []) {
  const requested = new Set(exits)
  return BOUNDARY_EXITS.reduce((mask, exit, index) => requested.has(exit.id) ? mask | (1 << index) : mask, 0)
}

function layoutFor(internalMasks, boundaryMask) {
  const cells = [...internalMasks]
  BOUNDARY_EXITS.forEach((exit, index) => {
    if (boundaryMask & (1 << index)) cells[exit.cell] |= exit.direction
  })
  const usage = Object.fromEntries(PUZZLE_TYPES.map(type => [type, 0]))
  for (const mask of cells) {
    const type = typeForMask(mask)
    if (!type) return null
    usage[type] += 1
  }
  return { cells, usage }
}

function fitsInventory(usage, inventory) {
  return PUZZLE_TYPES.every(type => usage[type] <= inventory[type])
}

export function solvePuzzle({ counts = {}, requiredExits = [], forbiddenExits = [], solutionLimit = 100 } = {}) {
  const inventory = normalizeCounts(counts)
  const available = PUZZLE_TYPES.reduce((sum, type) => sum + inventory[type], 0)
  const limit = Math.max(1, Math.min(1000, Math.floor(Number(solutionLimit) || 100)))
  if (available < 9) {
    return { score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'INSUFFICIENT_FRAGMENTS' }
  }

  const requiredMask = boundaryExitMask(requiredExits)
  const forbiddenMask = boundaryExitMask(forbiddenExits)
  if (requiredMask & forbiddenMask) {
    return { score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'NO_SOLUTION' }
  }
  const seen = new Set()
  for (let score = 12; score >= popcount(requiredMask); score -= 1) {
    const solutions = []
    let totalOptimalCount = 0
    for (const boundaryMask of BOUNDARY_MASKS_BY_SCORE[score]) {
      if ((boundaryMask & requiredMask) !== requiredMask) continue
      if (boundaryMask & forbiddenMask) continue
      for (const internalMasks of CONNECTED_INTERNAL_MASKS) {
        const candidate = layoutFor(internalMasks, boundaryMask)
        if (!candidate || !fitsInventory(candidate.usage, inventory)) continue
        const key = candidate.cells.join(',')
        if (seen.has(key)) continue
        seen.add(key)
        totalOptimalCount += 1
        if (solutions.length < limit) {
          solutions.push({
            cells: candidate.cells.map((mask, index) => ({
              index,
              row: Math.floor(index / 3),
              column: index % 3,
              mask,
              type: typeForMask(mask),
              orientation: orientationForMask(mask)
            })),
            usage: candidate.usage,
            exits: BOUNDARY_EXITS.filter((_exit, index) => boundaryMask & (1 << index)).map(exit => exit.id),
            sourceSlots: []
          })
        }
      }
    }
    if (totalOptimalCount) {
      return { score, totalOptimalCount, solutions, truncated: totalOptimalCount > solutions.length, error: '' }
    }
  }
  return { score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'NO_SOLUTION' }
}

export function assignSourceSlots(solution, slots = []) {
  if (!solution) return []
  const available = new Map(PUZZLE_TYPES.map(type => [type, slots
    .filter(slot => slot?.occupied && slot.type === type)
    .sort((left, right) => {
      const leftConfidence = left.corrected ? 2 : Number(left.confidence || 0)
      const rightConfidence = right.corrected ? 2 : Number(right.confidence || 0)
      return rightConfidence - leftConfidence || left.row - right.row || left.column - right.column
    })]))
  const sourceSlots = []
  for (const cell of solution.cells) {
    const source = available.get(cell.type)?.shift()
    if (!source) return []
    sourceSlots.push({ row: source.row, column: source.column, type: source.type, cellIndex: cell.index })
  }
  return sourceSlots
}

export function validateSolution(solution) {
  if (!solution?.cells || solution.cells.length !== 9) return false
  const masks = solution.cells.map(cell => Number(cell.mask) & 15)
  for (const edge of INTERNAL_EDGES) {
    const left = Boolean(masks[edge.a] & edge.aDirection)
    const right = Boolean(masks[edge.b] & edge.bDirection)
    if (left !== right) return false
  }
  const visited = new Set([0])
  const queue = [0]
  while (queue.length) {
    const current = queue.shift()
    INTERNAL_EDGES.forEach(edge => {
      if (edge.a === current && masks[edge.a] & edge.aDirection && !visited.has(edge.b)) {
        visited.add(edge.b); queue.push(edge.b)
      } else if (edge.b === current && masks[edge.b] & edge.bDirection && !visited.has(edge.a)) {
        visited.add(edge.a); queue.push(edge.a)
      }
    })
  }
  return visited.size === 9
}
