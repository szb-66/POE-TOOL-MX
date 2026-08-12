export const RECIPE_SLOT_LABELS = Object.freeze({
  bodyArmour: '胸甲',
  oneHandWeapon: '一手武器/盾牌',
  twoHandWeapon: '双手武器',
  helmet: '头盔',
  gloves: '手套',
  boots: '鞋子',
  belt: '腰带',
  amulet: '项链',
  ring: '戒指'
})

export const CLASSIC_INFLUENCES = Object.freeze([
  'shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'
])

export const VENDOR_RECIPE_CATALOG = Object.freeze({
  chance: Object.freeze({ id: 'chance', label: '机会石', shortLabel: '机', kind: 'set', rewardPerItem: 1 }),
  chaos: Object.freeze({ id: 'chaos', label: '混沌石', shortLabel: '混', kind: 'set', rewardPerItem: 1 }),
  regal: Object.freeze({ id: 'regal', label: '富豪石', shortLabel: '富', kind: 'set', rewardPerItem: 1 }),
  exalted: Object.freeze({ id: 'exalted', label: '崇高石', shortLabel: '崇', kind: 'set', rewardPerItem: 1 }),
  chromatic: Object.freeze({ id: 'chromatic', label: '幻色石', shortLabel: '幻', kind: 'single', rewardPerItem: 1 }),
  jeweller: Object.freeze({ id: 'jeweller', label: '工匠石', shortLabel: '孔', kind: 'single', rewardPerItem: 7 }),
  fusing: Object.freeze({ id: 'fusing', label: '链结石', shortLabel: '连', kind: 'single', rewardPerItem: 20 })
})

export const VENDOR_RECIPE_IDS = Object.freeze(Object.keys(VENDOR_RECIPE_CATALOG))
export const SINGLE_RECIPE_IDS = Object.freeze(['chromatic', 'jeweller', 'fusing'])

export function selectAllSingleRecipeItems(snapshot) {
  return Object.fromEntries(SINGLE_RECIPE_IDS.map((id) => [
    id,
    (snapshot?.recipes?.[id]?.candidates || []).map((item) => String(item.id))
  ]))
}

export function vendorRecipeAvailableCount(snapshot, recipeId, selectedItemIdsByRecipe = null) {
  const definition = VENDOR_RECIPE_CATALOG[recipeId]
  if (!definition) return 0
  const recipe = snapshot?.recipes?.[recipeId] || (recipeId === 'chaos' ? snapshot : null)
  if (definition.kind === 'set') return Math.max(0, Number(recipe?.fullSetCount) || 0)
  if (!selectedItemIdsByRecipe) return Math.max(0, Number(recipe?.candidateCount) || 0)
  const selectedIds = new Set((selectedItemIdsByRecipe[recipeId] || []).map(String))
  return (recipe?.candidates || []).filter((item) => selectedIds.has(String(item.id))).length
}

export function buildVendorRecipeOptions(snapshot, selectedItemIdsByRecipe = null) {
  return VENDOR_RECIPE_IDS.map((id) => ({
    value: id,
    label: `${VENDOR_RECIPE_CATALOG[id].label}(${vendorRecipeAvailableCount(snapshot, id, selectedItemIdsByRecipe)})`
  }))
}

const SINGLE_SLOTS = ['bodyArmour', 'helmet', 'gloves', 'boots', 'belt', 'amulet']
const PICK_ORDER = ['bodyArmour', 'oneHandWeapon', 'twoHandWeapon', 'helmet', 'gloves', 'boots', 'belt', 'amulet', 'ring']
const EQUIPMENT_SOCKET_COLOURS = new Set(['R', 'G', 'B', 'W'])

const itemId = (item) => String(item?.id || '')
const byLocation = (left, right) =>
  Number(left?.tabIndex || 0) - Number(right?.tabIndex || 0) ||
  Number(left?.y || 0) - Number(right?.y || 0) ||
  Number(left?.x || 0) - Number(right?.x || 0) ||
  itemId(left).localeCompare(itemId(right))
const isRare = (item) => item?.frameType === 2 || item?.rarity === 'rare'
const eligibleByIdentification = (item, options) => Boolean(options.includeIdentified || !item?.identified)

export function classicInfluences(item) {
  const values = Array.isArray(item?.influences) ? item.influences : []
  return CLASSIC_INFLUENCES.filter((influence) => values.includes(influence))
}

function equipmentSockets(item) {
  return (Array.isArray(item?.sockets) ? item.sockets : [])
    .filter((socket) => EQUIPMENT_SOCKET_COLOURS.has(String(socket?.sColour || '').toUpperCase()))
    .map((socket) => ({
      group: Math.max(0, Math.trunc(Number(socket.group) || 0)),
      colour: String(socket.sColour).toUpperCase()
    }))
}

export function socketSignature(item) {
  const groups = new Map()
  for (const socket of equipmentSockets(item)) {
    if (!groups.has(socket.group)) groups.set(socket.group, [])
    groups.get(socket.group).push(socket.colour)
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, colours]) => colours.join('-'))
    .join(' ')
}

export function classifySocketRecipe(item) {
  const sockets = equipmentSockets(item)
  if (sockets.length === 6 && new Set(sockets.map((socket) => socket.group)).size === 1) return 'fusing'
  if (sockets.length === 6) return 'jeweller'
  const groups = new Map()
  for (const socket of sockets) {
    if (!groups.has(socket.group)) groups.set(socket.group, new Set())
    groups.get(socket.group).add(socket.colour)
  }
  if ([...groups.values()].some((colours) => ['R', 'G', 'B'].every((colour) => colours.has(colour)))) {
    return 'chromatic'
  }
  return null
}

function protectedFromRegularSets(item) {
  return Boolean(classifySocketRecipe(item) || classicInfluences(item).length)
}

export function filterChaosCandidates(items, { includeIdentified = false } = {}) {
  return (Array.isArray(items) ? items : []).filter((item) =>
    item?.itemClass &&
    isRare(item) &&
    Number(item.itemLevel) >= 60 &&
    !protectedFromRegularSets(item) &&
    (includeIdentified || !item.identified)
  )
}

export function summarizeChaosItemPipeline(items, options = {}) {
  const source = Array.isArray(items) ? items : []
  const rareItems = source.filter(isRare)
  const rareLevel60Items = rareItems.filter((item) => Number(item.itemLevel) >= 60)
  const classEligibleItems = rareLevel60Items.filter((item) => item.itemClass)
  return {
    receivedItemCount: source.length,
    recognizedItemCount: source.filter((item) => item.itemClass).length,
    rareItemCount: rareItems.length,
    level60ItemCount: source.filter((item) => Number(item.itemLevel) >= 60).length,
    rareLevel60EquipmentCount: classEligibleItems.length,
    identifiedExcludedCount: options.includeIdentified
      ? 0
      : classEligibleItems.filter((item) => item.identified).length,
    unrecognizedRareLevel60Count: rareLevel60Items.filter((item) => !item.itemClass).length,
    eligibleItemCount: filterChaosCandidates(source, options).length
  }
}

function groupCandidates(candidates, compareItems = byLocation) {
  const groups = Object.fromEntries(Object.keys(RECIPE_SLOT_LABELS).map((key) => [key, []]))
  for (const item of candidates) groups[item.itemClass]?.push(item)
  for (const list of Object.values(groups)) list.sort(compareItems)
  return groups
}

function weaponChoice(groups, setCount, isAnchor) {
  let best = null
  for (let twoHandCount = 0; twoHandCount <= Math.min(setCount, groups.twoHandWeapon.length); twoHandCount += 1) {
    const oneHandCount = (setCount - twoHandCount) * 2
    if (groups.oneHandWeapon.length < oneHandCount) continue
    const anchorCount =
      Math.min(twoHandCount, groups.twoHandWeapon.filter(isAnchor).length) +
      Math.min(oneHandCount, groups.oneHandWeapon.filter(isAnchor).length)
    const choice = { twoHandCount, oneHandCount, anchorCount }
    if (!best || choice.anchorCount > best.anchorCount ||
        (choice.anchorCount === best.anchorCount && choice.oneHandCount < best.oneHandCount)) best = choice
  }
  return best
}

function feasibleSetPlan(groups, setCount, policy) {
  if (setCount <= 0) return null
  if (SINGLE_SLOTS.some((slot) => groups[slot].length < setCount)) return null
  if (groups.ring.length < setCount * 2) return null
  const weapons = weaponChoice(groups, setCount, policy.isAnchor)
  if (!weapons) return null
  if (!policy.requiresAnchor) return weapons
  const nonWeaponAnchorCapacity =
    SINGLE_SLOTS.reduce((sum, slot) => sum + Math.min(setCount, groups[slot].filter(policy.isAnchor).length), 0) +
    Math.min(setCount * 2, groups.ring.filter(policy.isAnchor).length)
  if (nonWeaponAnchorCapacity + weapons.anchorCount < setCount) return null
  return weapons
}

function maximumSetCount(groups, policy) {
  const upper = Math.min(
    ...SINGLE_SLOTS.map((slot) => groups[slot].length),
    Math.floor(groups.ring.length / 2),
    groups.twoHandWeapon.length + Math.floor(groups.oneHandWeapon.length / 2)
  )
  for (let count = upper; count > 0; count -= 1) {
    const weapons = feasibleSetPlan(groups, count, policy)
    if (weapons) return { count, weapons }
  }
  return { count: 0, weapons: null }
}

function chooseItems(items, count, policy) {
  return [...items].sort((left, right) =>
    Number(policy.isAnchor(right)) - Number(policy.isAnchor(left)) ||
    policy.compareItems(left, right)
  ).slice(0, count)
}

function createTargets(setCount, capacity = 1, start = 0, end = setCount) {
  const targets = []
  for (let pass = 0; pass < capacity; pass += 1) {
    for (let setIndex = start; setIndex < end; setIndex += 1) targets.push(setIndex)
  }
  return targets
}

function assignItems(sets, slot, items, targets, policy) {
  const remainingTargets = [...targets]
  for (const item of items) {
    let targetOffset = 0
    if (policy.isAnchor(item)) {
      const withoutAnchor = remainingTargets.findIndex((setIndex) => !sets[setIndex].hasAnchor)
      if (withoutAnchor >= 0) targetOffset = withoutAnchor
    }
    const [setIndex] = remainingTargets.splice(targetOffset, 1)
    if (setIndex == null) continue
    sets[setIndex].items.push(item)
    sets[setIndex].slots[slot] = [...(sets[setIndex].slots[slot] || []), item]
    if (policy.isAnchor(item)) sets[setIndex].hasAnchor = true
  }
}

function buildSets(groups, setCount, weapons, policy) {
  const sets = Array.from({ length: setCount }, (_, index) => ({
    id: `${policy.recipeId}-set-${index + 1}`,
    recipeId: policy.recipeId,
    influence: policy.influence || '',
    index,
    items: [],
    slots: {},
    hasAnchor: false,
    hasLowLevel: false,
    allUnidentified: true
  }))
  for (const slot of SINGLE_SLOTS) {
    assignItems(sets, slot, chooseItems(groups[slot], setCount, policy), createTargets(setCount), policy)
  }
  assignItems(sets, 'ring', chooseItems(groups.ring, setCount * 2, policy), createTargets(setCount, 2), policy)
  assignItems(
    sets,
    'twoHandWeapon',
    chooseItems(groups.twoHandWeapon, weapons.twoHandCount, policy),
    createTargets(setCount, 1, 0, weapons.twoHandCount),
    policy
  )
  assignItems(
    sets,
    'oneHandWeapon',
    chooseItems(groups.oneHandWeapon, weapons.oneHandCount, policy),
    createTargets(setCount, 2, weapons.twoHandCount, setCount),
    policy
  )
  for (const set of sets) {
    set.items.sort((left, right) =>
      PICK_ORDER.indexOf(left.itemClass) - PICK_ORDER.indexOf(right.itemClass) || byLocation(left, right)
    )
    set.hasLowLevel = set.items.some((item) => Number(item.itemLevel) >= 60 && Number(item.itemLevel) <= 74)
    set.allUnidentified = set.items.every((item) => !item.identified)
    set.reward = set.allUnidentified ? 2 : 1
  }
  return sets
}

function slotCounts(groups) {
  return Object.fromEntries(Object.entries(groups).map(([slot, items]) => [slot, items.length]))
}

function missingForNextSet(groups, policy) {
  const missing = {}
  for (const slot of SINGLE_SLOTS) missing[slot] = Math.max(0, 1 - groups[slot].length)
  missing.ring = Math.max(0, 2 - groups.ring.length)
  const weaponCapacity = groups.twoHandWeapon.length + Math.floor(groups.oneHandWeapon.length / 2)
  missing.weapon = Math.max(0, 1 - weaponCapacity)
  if (policy.requiresAnchor) {
    missing.levelBand = Math.max(0, 1 - Object.values(groups).flat().filter(policy.isAnchor).length)
  }
  return missing
}

function calculateSetRecipe(candidates, policy) {
  const catalog = VENDOR_RECIPE_CATALOG[policy.recipeId]
  const normalizedPolicy = {
    requiresAnchor: false,
    isAnchor: () => false,
    compareItems: byLocation,
    ...policy
  }
  const groups = groupCandidates(candidates, normalizedPolicy.compareItems)
  const maximum = maximumSetCount(groups, normalizedPolicy)
  const sets = maximum.count ? buildSets(groups, maximum.count, maximum.weapons, normalizedPolicy) : []
  const missing = missingForNextSet(groups, normalizedPolicy)
  if (policy.recipeId === 'chaos' && Object.hasOwn(missing, 'levelBand')) {
    missing.lowLevel = missing.levelBand
    delete missing.levelBand
  }
  return {
    ...catalog,
    candidates,
    candidateCount: candidates.length,
    counts: slotCounts(groups),
    fullSetCount: sets.length,
    rewardTotal: sets.reduce((sum, set) => sum + set.reward, 0),
    needsLowLevel: policy.recipeId === 'chaos' &&
      sets.length === 0 &&
      Object.entries(missing).every(([key, count]) => key === 'lowLevel' || count === 0) &&
      missing.lowLevel > 0,
    missing,
    sets
  }
}

function regularSetCandidates(items, options, predicate) {
  return items.filter((item) =>
    item?.itemClass &&
    isRare(item) &&
    eligibleByIdentification(item, options) &&
    !protectedFromRegularSets(item) &&
    predicate(item)
  )
}

function permutations(values) {
  if (values.length <= 1) return [values]
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)])
      .map((tail) => [value, ...tail])
  )
}

function calculateExaltedRecipe(items, options) {
  const candidates = items.filter((item) =>
    item?.itemClass &&
    isRare(item) &&
    eligibleByIdentification(item, options) &&
    !classifySocketRecipe(item) &&
    classicInfluences(item).length
  )
  const activeInfluences = CLASSIC_INFLUENCES.filter((influence) =>
    candidates.some((item) => classicInfluences(item).includes(influence))
  )
  let bestSets = []
  let bestKey = ''
  for (const order of permutations(activeInfluences)) {
    let remaining = [...candidates]
    const sets = []
    for (const influence of order) {
      const result = calculateSetRecipe(
        remaining.filter((item) => classicInfluences(item).includes(influence)),
        {
          recipeId: 'exalted',
          influence,
          compareItems: (left, right) =>
            classicInfluences(left).length - classicInfluences(right).length || byLocation(left, right)
        }
      )
      sets.push(...result.sets)
      const used = new Set(result.sets.flatMap((set) => set.items.map(itemId)))
      remaining = remaining.filter((item) => !used.has(itemId(item)))
    }
    const reward = sets.reduce((sum, set) => sum + set.reward, 0)
    const key = sets.flatMap((set) => set.items.map(itemId)).sort().join('|')
    const bestReward = bestSets.reduce((sum, set) => sum + set.reward, 0)
    if (sets.length > bestSets.length ||
        (sets.length === bestSets.length && reward > bestReward) ||
        (sets.length === bestSets.length && reward === bestReward && (!bestKey || key < bestKey))) {
      bestSets = sets
      bestKey = key
    }
  }
  bestSets.sort((left, right) => byLocation(left.items[0], right.items[0]))
  bestSets.forEach((set, index) => {
    set.index = index
    set.id = `exalted-set-${index + 1}`
  })
  const nearResults = activeInfluences.map((influence) => calculateSetRecipe(
    candidates.filter((item) => classicInfluences(item).includes(influence)),
    { recipeId: 'exalted', influence }
  ))
  const nearest = nearResults.sort((left, right) =>
    Object.values(left.missing).reduce((sum, count) => sum + count, 0) -
    Object.values(right.missing).reduce((sum, count) => sum + count, 0)
  )[0]
  return {
    ...VENDOR_RECIPE_CATALOG.exalted,
    candidates,
    candidateCount: candidates.length,
    counts: nearest?.counts || slotCounts(groupCandidates([])),
    fullSetCount: bestSets.length,
    rewardTotal: bestSets.reduce((sum, set) => sum + set.reward, 0),
    needsLowLevel: false,
    missing: nearest?.missing || missingForNextSet(groupCandidates([]), { requiresAnchor: false }),
    sets: bestSets
  }
}

function singleRecipeResult(recipeId, candidates) {
  const catalog = VENDOR_RECIPE_CATALOG[recipeId]
  const decorated = candidates.sort(byLocation).map((item) => ({
    ...item,
    recipeId,
    socketSignature: socketSignature(item),
    reward: catalog.rewardPerItem
  }))
  return {
    ...catalog,
    candidates: decorated,
    candidateCount: decorated.length,
    rewardTotal: decorated.length * catalog.rewardPerItem,
    fullSetCount: 0,
    sets: [],
    counts: {},
    missing: {}
  }
}

export function calculateVendorRecipes(items, options = {}) {
  const source = Array.isArray(items) ? [...items] : []
  const socketGroups = { chromatic: [], jeweller: [], fusing: [] }
  for (const item of source) {
    const recipeId = classifySocketRecipe(item)
    if (recipeId) socketGroups[recipeId].push(item)
  }
  const recipes = {
    chance: calculateSetRecipe(
      regularSetCandidates(source, options, (item) => Number(item.itemLevel) >= 1),
      { recipeId: 'chance', requiresAnchor: true, isAnchor: (item) => Number(item.itemLevel) <= 59 }
    ),
    chaos: calculateSetRecipe(
      regularSetCandidates(source, options, (item) => Number(item.itemLevel) >= 60),
      {
        recipeId: 'chaos',
        requiresAnchor: true,
        isAnchor: (item) => Number(item.itemLevel) >= 60 && Number(item.itemLevel) <= 74
      }
    ),
    regal: calculateSetRecipe(
      regularSetCandidates(source, options, (item) => Number(item.itemLevel) >= 75),
      { recipeId: 'regal' }
    ),
    exalted: calculateExaltedRecipe(source, options),
    chromatic: singleRecipeResult('chromatic', socketGroups.chromatic),
    jeweller: singleRecipeResult('jeweller', socketGroups.jeweller),
    fusing: singleRecipeResult('fusing', socketGroups.fusing)
  }
  return { items: source, recipes, ...recipes.chaos }
}

export function calculateChaosRecipe(items, options = {}) {
  return calculateVendorRecipes(items, options).recipes.chaos
}

function groupPlanItems(items) {
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.tabId)) {
      groups.set(item.tabId, {
        tabId: item.tabId,
        tabIndex: item.tabIndex,
        tabName: item.tabName,
        tabType: item.tabType,
        inFolder: Boolean(item.inFolder),
        items: []
      })
    }
    groups.get(item.tabId).items.push(item)
  }
  const tabs = [...groups.values()].sort((left, right) => left.tabIndex - right.tabIndex)
  for (const tab of tabs) tab.items.sort((left, right) =>
    PICK_ORDER.indexOf(left.itemClass) - PICK_ORDER.indexOf(right.itemClass) || byLocation(left, right)
  )
  return tabs
}

export function createPickingPlan(snapshot, request = 1) {
  const normalizedRequest = typeof request === 'number'
    ? { recipeId: 'chaos', setCount: request }
    : { recipeId: 'chaos', ...(request || {}) }
  const recipeId = VENDOR_RECIPE_CATALOG[normalizedRequest.recipeId] ? normalizedRequest.recipeId : 'chaos'
  const recipe = snapshot?.recipes?.[recipeId] || (recipeId === 'chaos' ? snapshot : null)
  const catalog = VENDOR_RECIPE_CATALOG[recipeId]
  if (!recipe) return { recipeId, recipeLabel: catalog.label, kind: catalog.kind, setCount: 0, itemCount: 0, tabs: [] }
  let items = []
  let setCount = 0
  if (catalog.kind === 'set') {
    setCount = Math.max(0, Math.min(
      Math.trunc(Number(normalizedRequest.setCount) || 0),
      recipe.sets?.length || 0
    ))
    items = recipe.sets.slice(0, setCount).flatMap((set) =>
      set.items.map((item) => ({
        ...item,
        recipeId,
        recipeLabel: catalog.label,
        setId: set.id,
        verificationKind: 'set'
      }))
    )
  } else {
    const requestedIds = Array.isArray(normalizedRequest.itemIds)
      ? new Set(normalizedRequest.itemIds.map(String))
      : new Set((recipe.candidates || []).map((item) => itemId(item)))
    items = (recipe.candidates || [])
      .filter((item) => requestedIds.has(itemId(item)))
      .map((item) => ({
        ...item,
        recipeId,
        recipeLabel: catalog.label,
        verificationKind: 'socket',
        socketSignature: item.socketSignature || socketSignature(item)
      }))
  }
  const tabs = groupPlanItems(items)
  return {
    id: `vendor-plan-${Date.now()}`,
    recipeId,
    recipeLabel: catalog.label,
    kind: catalog.kind,
    setCount,
    selectedItemCount: catalog.kind === 'single' ? items.length : 0,
    itemCount: items.length,
    rewardTotal: catalog.kind === 'single'
      ? items.length * catalog.rewardPerItem
      : recipe.sets.slice(0, setCount).reduce((sum, set) => sum + set.reward, 0),
    tabs
  }
}
