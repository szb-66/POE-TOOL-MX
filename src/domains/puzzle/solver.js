import {
  VOYAGE_REWARD_STRATEGIES,
  normalizeVoyageRewardMode,
  normalizeVoyageRewardStrategy,
  scoreVoyageMod,
  voyageModEffect
} from './voyageRewards.js'

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

const POPCOUNT_BY_MASK = Object.freeze(Array.from({ length: 16 }, (_, mask) => popcount(mask)))
const CELL_COUNT_BY_POSITION_MASK = Object.freeze(Array.from({ length: 1 << 9 }, (_, mask) => popcount(mask)))
const TYPE_INDEX_BY_MASK = Object.freeze(Array.from({ length: 16 }, (_, mask) => PUZZLE_TYPES.indexOf(typeForMask(mask))))

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
  const types = []
  for (const mask of cells) {
    const type = typeForMask(mask)
    if (!type) return null
    types.push(type)
    usage[type] += 1
  }
  return { cells, types, usage }
}

function fitsInventory(usage, inventory) {
  return PUZZLE_TYPES.every(type => usage[type] <= inventory[type])
}

function slotOrder(left, right) {
  const leftConfidence = left.corrected ? 2 : Number(left.confidence || 0)
  const rightConfidence = right.corrected ? 2 : Number(right.confidence || 0)
  return rightConfidence - leftConfidence || Number(left.page || 1) - Number(right.page || 1) || left.row - right.row || left.column - right.column
}

const CELL_NEIGHBOR_COUNTS = Object.freeze([2, 3, 2, 3, 4, 3, 2, 3, 2])

function matchedMod(entry) {
  return entry?.status === 'matched' && Array.isArray(entry.mod?.lines) ? entry.mod : null
}

function cellBorderEffect(cellIndex, edges = {}) {
  return BOUNDARY_EXITS.reduce((sum, exit) => exit.cell === cellIndex
    ? sum + voyageModEffect(matchedMod(edges?.[exit.id]))
    : sum, 0)
}

function sourceReward(slot, cell, strategy, edges) {
  const scored = scoreVoyageMod(matchedMod(slot?.mods), strategy)
  const coverage = Number(scored.self) + Number(scored.adjacent) * CELL_NEIGHBOR_COUNTS[cell.index] + Number(scored.global) * 9
  return coverage * (1 + cellBorderEffect(cell.index, edges))
}

function hasRewardData(slots = [], edges = {}) {
  const valuable = mod => mod && (scoreVoyageMod(mod).total !== 0 || voyageModEffect(mod) !== 0)
  return slots.some(slot => valuable(matchedMod(slot?.mods))) || Object.values(edges || {}).some(edge => valuable(matchedMod(edge)))
}

function createSourceScoreTables(slots, strategy, edges) {
  return PUZZLE_TYPES.map(type => {
    const sources = slots.filter(slot => slot?.occupied && slot.type === type).sort(slotOrder)
    let scores = new Float64Array(1 << 9)
    scores.fill(Number.NEGATIVE_INFINITY)
    scores[0] = 0
    for (const source of sources) {
      const rewards = Array.from({ length: 9 }, (_, index) => sourceReward(source, { index, type }, strategy, edges))
      const next = scores.slice()
      for (let mask = 0; mask < scores.length; mask += 1) {
        if (!Number.isFinite(scores[mask])) continue
        for (let index = 0; index < 9; index += 1) {
          const bit = 1 << index
          if (mask & bit) continue
          next[mask | bit] = Math.max(next[mask | bit], scores[mask] + rewards[index])
        }
      }
      scores = next
    }
    return scores
  })
}

function createBorderScoreTable(edges, strategy) {
  const result = Array.from({ length: 9 }, () => new Float64Array(5))
  BOUNDARY_EXITS.forEach((exit, index) => {
    const mod = matchedMod(edges?.[exit.id])
    if (!mod) return
    for (let connections = 1; connections <= 4; connections += 1) {
      result[exit.cell][connections] += scoreVoyageMod(mod, strategy, { connections }).total
    }
  })
  return result
}

function materializeSolution(candidate, boundaryMask, rewardScore = null) {
  return {
    cells: candidate.cells.map((mask, index) => ({
      index,
      row: Math.floor(index / 3),
      column: index % 3,
      mask,
      type: candidate.types[index],
      orientation: orientationForMask(mask)
    })),
    usage: candidate.usage,
    exits: BOUNDARY_EXITS.filter((_exit, index) => boundaryMask & (1 << index)).map(exit => exit.id),
    sourceSlots: [],
    ...(rewardScore === null ? {} : { rewardScore })
  }
}

function rewardCandidate(internalMasks, additions, inventory, sourceScores, borderScores) {
  const cells = new Uint8Array(9)
  let endpoint = 0; let straight = 0; let corner = 0; let tee = 0; let cross = 0
  let borderReward = 0
  for (let index = 0; index < 9; index += 1) {
    const mask = internalMasks[index] | additions[index]
    cells[index] = mask
    const bit = 1 << index
    switch (TYPE_INDEX_BY_MASK[mask]) {
      case 0: endpoint |= bit; break
      case 1: straight |= bit; break
      case 2: corner |= bit; break
      case 3: tee |= bit; break
      case 4: cross |= bit; break
      default: return null
    }
    borderReward += borderScores[index][POPCOUNT_BY_MASK[mask]]
  }
  if (CELL_COUNT_BY_POSITION_MASK[endpoint] > inventory.endpoint ||
      CELL_COUNT_BY_POSITION_MASK[straight] > inventory.straight ||
      CELL_COUNT_BY_POSITION_MASK[corner] > inventory.corner ||
      CELL_COUNT_BY_POSITION_MASK[tee] > inventory.tee ||
      CELL_COUNT_BY_POSITION_MASK[cross] > inventory.cross) return null
  const rewardScore = sourceScores[0][endpoint] + sourceScores[1][straight] + sourceScores[2][corner] + sourceScores[3][tee] + sourceScores[4][cross] + borderReward
  return { cells, rewardScore }
}

function solveRewardPuzzle({ inventory, slots, edges, strategy, requiredMask, forbiddenMask, limit }) {
  const sourceScores = createSourceScoreTables(slots, strategy, edges)
  const borderScores = createBorderScoreTable(edges, strategy)
  let best = null
  for (let score = 12; score >= popcount(requiredMask); score -= 1) {
    for (const boundaryMask of BOUNDARY_MASKS_BY_SCORE[score]) {
      if ((boundaryMask & requiredMask) !== requiredMask || boundaryMask & forbiddenMask) continue
      const additions = new Uint8Array(9)
      BOUNDARY_EXITS.forEach((exit, index) => { if (boundaryMask & (1 << index)) additions[exit.cell] |= exit.direction })
      for (const internalMasks of CONNECTED_INTERNAL_MASKS) {
        const scored = rewardCandidate(internalMasks, additions, inventory, sourceScores, borderScores)
        if (!scored) continue
        const better = !best || scored.rewardScore > best.rewardScore + 1e-9 || (Math.abs(scored.rewardScore - best.rewardScore) <= 1e-9 && score > best.score)
        if (better) best = { score, rewardScore: scored.rewardScore, totalOptimalCount: 0, solutions: [] }
        if (scored.rewardScore < best.rewardScore - 1e-9 || score < best.score) continue
        best.totalOptimalCount += 1
        if (best.solutions.length < limit) {
          const candidate = layoutFor(scored.cells, 0)
          const solution = materializeSolution(candidate, boundaryMask, scored.rewardScore)
          solution.sourceSlots = assignSourceSlots(solution, slots, { strategy, edges })
          best.solutions.push(solution)
        }
      }
    }
  }
  return best
}

export function solvePuzzle({ counts = {}, slots = [], edges = {}, strategy = 'balanced', requiredExits = [], forbiddenExits = [], solutionLimit = 100 } = {}) {
  const normalizedStrategy = normalizeVoyageRewardMode(strategy)
  const inventory = normalizeCounts(Array.isArray(slots) && slots.length ? countsFromSlots(slots) : counts)
  const available = PUZZLE_TYPES.reduce((sum, type) => sum + inventory[type], 0)
  const limit = Math.max(1, Math.min(1000, Math.floor(Number(solutionLimit) || 100)))
  const rewardDataAvailable = hasRewardData(slots, edges)
  if (available < 9) {
    return { score: null, rewardScore: null, rewardDataAvailable, strategy: normalizedStrategy, effectiveStrategy: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'INSUFFICIENT_FRAGMENTS' }
  }

  const requiredMask = boundaryExitMask(requiredExits)
  const forbiddenMask = boundaryExitMask(forbiddenExits)
  if (requiredMask & forbiddenMask) {
    return { score: null, rewardScore: null, rewardDataAvailable, strategy: normalizedStrategy, effectiveStrategy: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'NO_SOLUTION' }
  }
  if (rewardDataAvailable) {
    const strategies = normalizedStrategy === 'auto'
      ? VOYAGE_REWARD_STRATEGIES.map(option => option.id)
      : [normalizedStrategy]
    let selected = null
    for (const effectiveStrategy of strategies) {
      const candidate = solveRewardPuzzle({ inventory, slots, edges, strategy: effectiveStrategy, requiredMask, forbiddenMask, limit })
      if (!candidate?.totalOptimalCount) continue
      const rewardScore = Math.round(candidate.rewardScore * 10) / 10
      if (!selected || rewardScore > selected.rewardScore) selected = { ...candidate, rewardScore, effectiveStrategy }
    }
    if (!selected) {
      return { score: null, rewardScore: null, rewardDataAvailable, strategy: normalizedStrategy, effectiveStrategy: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'NO_SOLUTION' }
    }
    return { ...selected, rewardDataAvailable, strategy: normalizedStrategy, truncated: selected.totalOptimalCount > selected.solutions.length, error: '' }
  }
  for (let score = 12; score >= popcount(requiredMask); score -= 1) {
    const fallbackSolutions = []
    let fallbackCount = 0
    for (const boundaryMask of BOUNDARY_MASKS_BY_SCORE[score]) {
      if ((boundaryMask & requiredMask) !== requiredMask) continue
      if (boundaryMask & forbiddenMask) continue
      for (const internalMasks of CONNECTED_INTERNAL_MASKS) {
        const candidate = layoutFor(internalMasks, boundaryMask)
        if (!candidate || !fitsInventory(candidate.usage, inventory)) continue
        fallbackCount += 1
        if (fallbackSolutions.length < limit) fallbackSolutions.push(materializeSolution(candidate, boundaryMask))
      }
    }
    if (fallbackCount) {
      const effectiveStrategy = normalizedStrategy === 'auto' ? null : normalizedStrategy
      const solutions = slots.length
        ? fallbackSolutions.map(solution => ({
            ...solution,
            sourceSlots: assignSourceSlots(solution, slots, { strategy: effectiveStrategy || 'balanced', edges })
          }))
        : fallbackSolutions
      return { score, rewardScore: null, rewardDataAvailable, strategy: normalizedStrategy, effectiveStrategy, totalOptimalCount: fallbackCount, solutions, truncated: fallbackCount > solutions.length, error: '' }
    }
  }
  return { score: null, rewardScore: null, rewardDataAvailable, strategy: normalizedStrategy, effectiveStrategy: null, totalOptimalCount: 0, solutions: [], truncated: false, error: 'NO_SOLUTION' }
}

export function assignSourceSlots(solution, slots = [], { strategy = 'balanced', edges = {} } = {}) {
  if (!solution) return []
  const sourceSlots = []
  for (const type of PUZZLE_TYPES) {
    const cells = solution.cells.filter(cell => cell.type === type)
    if (!cells.length) continue
    const available = slots.filter(slot => slot?.occupied && slot.type === type).sort(slotOrder)
    let states = new Map([[0, { score: 0, assignments: [] }]])
    for (const source of available) {
      const next = new Map(states)
      for (const [mask, state] of states) {
        for (let index = 0; index < cells.length; index += 1) {
          if (mask & (1 << index)) continue
          const cell = cells[index]
          const rewardScore = sourceReward(source, cell, strategy, edges)
          const nextMask = mask | (1 << index)
          const score = state.score + rewardScore
          if (!next.has(nextMask) || score > next.get(nextMask).score + 1e-9) {
            next.set(nextMask, { score, assignments: [...state.assignments, { source, cell, rewardScore }] })
          }
        }
      }
      states = next
    }
    const selected = states.get((1 << cells.length) - 1)
    if (!selected) return []
    sourceSlots.push(...selected.assignments.map(({ source, cell, rewardScore }) => ({
      page: Number(source.page || 1),
      row: source.row,
      column: source.column,
      type: source.type,
      cellIndex: cell.index,
      rewardScore
    })))
  }
  return sourceSlots.sort((left, right) => left.cellIndex - right.cellIndex)
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
