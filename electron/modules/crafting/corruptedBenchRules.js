import { createSockets, rollSocketColor, singletonLinks } from './equipmentPropertyRules.js'
import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const CORRUPTED_BENCH_RULESET = Object.freeze({ game: SEASON_BASELINE.game, patch: SEASON_BASELINE.patch, locale: SEASON_BASELINE.locale })

const socketCosts = [null, null, 1, 3, 10, 70, 350]
const linkCosts = [null, null, 1, 3, 5, 150, 1500]
const colourPatterns = [
  ['1r', '至少一个红色插槽', ['R'], 4], ['2r', '至少两个红色插槽', ['R', 'R'], 25], ['3r', '至少三个红色插槽', ['R', 'R', 'R'], 120],
  ['1g', '至少一个绿色插槽', ['G'], 4], ['2g', '至少两个绿色插槽', ['G', 'G'], 25], ['3g', '至少三个绿色插槽', ['G', 'G', 'G'], 120],
  ['1b', '至少一个蓝色插槽', ['B'], 4], ['2b', '至少两个蓝色插槽', ['B', 'B'], 25], ['3b', '至少三个蓝色插槽', ['B', 'B', 'B'], 120],
  ['1r1g', '至少一个红色和一个绿色插槽', ['R', 'G'], 15], ['1r1b', '至少一个红色和一个蓝色插槽', ['R', 'B'], 15], ['1g1b', '至少一个绿色和一个蓝色插槽', ['G', 'B'], 15],
  ['2b1r', '至少两个蓝色和一个红色插槽', ['B', 'B', 'R'], 100], ['2b1g', '至少两个蓝色和一个绿色插槽', ['B', 'B', 'G'], 100],
  ['2r1g', '至少两个红色和一个绿色插槽', ['R', 'R', 'G'], 100], ['2r1b', '至少两个红色和一个蓝色插槽', ['R', 'R', 'B'], 100],
  ['2g1b', '至少两个绿色和一个蓝色插槽', ['G', 'G', 'B'], 100], ['2g1r', '至少两个绿色和一个红色插槽', ['G', 'G', 'R'], 100]
]

function dualCost(resourceId, resourceName, amount) {
  return [
    { resourceId, resourceName, amount },
    { resourceId: 'currency:vaal', resourceName: '瓦尔宝珠', amount }
  ]
}

export const CORRUPTED_BENCH_RECIPES = Object.freeze([
  ...Array.from({ length: 5 }, (_, index) => index + 2).map((target) => ({
    id: `corrupted-bench:sockets:${target}`, kind: 'corrupted-sockets', name: `${target} 个插槽`, target,
    description: `将腐化装备设为 ${target} 个插槽；工艺台忽略物品等级限制。`,
    cost: dualCost('currency:jewellers', '珠宝匠石', socketCosts[target])
  })),
  ...Array.from({ length: 5 }, (_, index) => index + 2).map((target) => ({
    id: `corrupted-bench:links:${target}`, kind: 'corrupted-links', name: `${target} 个相连插槽`, target,
    description: `将腐化装备的最大连接组设为 ${target}。`,
    cost: dualCost('currency:fusing', '链接石', linkCosts[target])
  })),
  ...colourPatterns.map(([id, name, colors, amount]) => ({
    id: `corrupted-bench:colours:${id}`, kind: 'corrupted-colours', name, colors,
    description: `重铸腐化装备孔色，并保证${name.replace('至少', '')}。`,
    cost: dualCost('currency:chromatic', '幻色石', amount)
  }))
])

export function corruptedBenchReason(state, base, recipe) {
  if (state.mirrored) return '镜像物品不能使用工艺台修改插槽'
  if (!state.corrupted) return '该组工艺仅用于已腐化装备'
  if (!base.socketLimit) return '该底材不能拥有彩色插槽'
  if (recipe.kind === 'corrupted-sockets') {
    if (recipe.target > base.socketLimit) return `该底材最多只能拥有 ${base.socketLimit} 个插槽`
    return state.sockets.length === recipe.target ? `当前装备已经有 ${recipe.target} 个插槽` : ''
  }
  if (state.sockets.length < recipe.target && recipe.kind === 'corrupted-links') return `该工艺要求至少 ${recipe.target} 个插槽`
  if (recipe.kind === 'corrupted-links') {
    const current = Math.max(1, ...(state.links ?? []).map((group) => group.length))
    return current === recipe.target ? `当前最大连接已经是 ${recipe.target}` : ''
  }
  if (state.sockets.length < recipe.colors.length) return `该工艺要求至少 ${recipe.colors.length} 个插槽`
  return ''
}

export function corruptedBenchCatalog(state, base) {
  return CORRUPTED_BENCH_RECIPES.filter((recipe) => recipe.kind !== 'corrupted-sockets' || recipe.target <= base.socketLimit).map((recipe) => {
    const unavailableReason = corruptedBenchReason(state, base, recipe)
    return {
      ...structuredClone(recipe), category: 'socket', providerActionId: recipe.id, effect: recipe.description, affixType: '', requiredLevel: 1,
      requirements: '已腐化、未镜像且底材支持所需孔位的装备', consequences: '确定性修改孔位；额外消耗与普通通货数量相同的瓦尔宝珠',
      baseCost: structuredClone(recipe.cost), replacementCost: [], replacesExisting: false, replacedAffix: null,
      displayTags: [{ id: 'corrupted-socket', label: '腐化插槽' }], unlock: '对应插槽工艺配方', isMeta: false,
      canApply: !unavailableReason, unavailableReason
    }
  })
}

export function applyCorruptedBenchRecipe(state, base, recipe, rng = Math.random) {
  if (recipe.kind === 'corrupted-sockets') {
    const previous = state.sockets
    state.sockets = recipe.target <= previous.length
      ? previous.slice(0, recipe.target)
      : [...previous, ...createSockets(recipe.target - previous.length, base.requirements, rng).map((socket, index) => ({ ...socket, id: `socket:${previous.length + index + 1}` }))]
    const allowed = new Set(state.sockets.map((socket) => socket.id))
    state.links = (state.links ?? []).map((group) => group.filter((id) => allowed.has(id))).filter((group) => group.length)
    const linked = new Set(state.links.flat())
    state.sockets.forEach((socket) => { if (!linked.has(socket.id)) state.links.push([socket.id]) })
  } else if (recipe.kind === 'corrupted-links') {
    const ids = state.sockets.map((socket) => socket.id)
    state.links = [ids.slice(0, recipe.target), ...ids.slice(recipe.target).map((id) => [id])]
  } else {
    state.sockets = state.sockets.map((socket, index) => ({ ...socket, color: recipe.colors[index] ?? rollSocketColor(base.requirements, rng) }))
  }
  if (!state.links.length) state.links = singletonLinks(state.sockets)
  return state
}
