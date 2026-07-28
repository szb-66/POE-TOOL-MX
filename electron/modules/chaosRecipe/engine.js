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

const SINGLE_SLOTS = ['bodyArmour', 'helmet', 'gloves', 'boots', 'belt', 'amulet']
const PICK_ORDER = ['bodyArmour', 'oneHandWeapon', 'twoHandWeapon', 'helmet', 'gloves', 'boots', 'belt', 'amulet', 'ring']

const byLocation = (left, right) =>
  left.tabIndex - right.tabIndex || left.y - right.y || left.x - right.x || left.id.localeCompare(right.id)
const byLowThenLocation = (left, right) =>
  Number(right.itemLevel >= 60 && right.itemLevel <= 74) -
  Number(left.itemLevel >= 60 && left.itemLevel <= 74) || byLocation(left, right)

export function filterChaosCandidates(items, { includeIdentified = false } = {}) {
  return (Array.isArray(items) ? items : []).filter((item) =>
    item?.itemClass &&
    (item.frameType === 2 || item.rarity === 'rare') &&
    Number(item.itemLevel) >= 60 &&
    (includeIdentified || !item.identified)
  )
}

export function summarizeChaosItemPipeline(items, options = {}) {
  const source = Array.isArray(items) ? items : []
  const rareItems = source.filter((item) => item.frameType === 2 || item.rarity === 'rare')
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

function groupCandidates(candidates) {
  const groups = Object.fromEntries(Object.keys(RECIPE_SLOT_LABELS).map((key) => [key, []]))
  for (const item of candidates) groups[item.itemClass]?.push(item)
  for (const list of Object.values(groups)) list.sort(byLowThenLocation)
  return groups
}

function weaponChoice(groups, setCount) {
  let best = null
  for (let twoHandCount = 0; twoHandCount <= Math.min(setCount, groups.twoHandWeapon.length); twoHandCount += 1) {
    const oneHandCount = (setCount - twoHandCount) * 2
    if (groups.oneHandWeapon.length < oneHandCount) continue
    const lowCount =
      Math.min(twoHandCount, groups.twoHandWeapon.filter(isLowLevel).length) +
      Math.min(oneHandCount, groups.oneHandWeapon.filter(isLowLevel).length)
    const choice = { twoHandCount, oneHandCount, lowCount }
    if (!best || choice.lowCount > best.lowCount ||
        (choice.lowCount === best.lowCount && choice.oneHandCount < best.oneHandCount)) best = choice
  }
  return best
}

const isLowLevel = (item) => item.itemLevel >= 60 && item.itemLevel <= 74

function feasibleSetPlan(groups, setCount) {
  if (setCount <= 0) return null
  if (SINGLE_SLOTS.some((slot) => groups[slot].length < setCount)) return null
  if (groups.ring.length < setCount * 2) return null
  const weapons = weaponChoice(groups, setCount)
  if (!weapons) return null

  const nonWeaponLowCapacity =
    SINGLE_SLOTS.reduce((sum, slot) => sum + Math.min(setCount, groups[slot].filter(isLowLevel).length), 0) +
    Math.min(setCount * 2, groups.ring.filter(isLowLevel).length)
  if (nonWeaponLowCapacity + weapons.lowCount < setCount) return null
  return weapons
}

function maximumSetCount(groups) {
  const upper = Math.min(
    ...SINGLE_SLOTS.map((slot) => groups[slot].length),
    Math.floor(groups.ring.length / 2),
    groups.twoHandWeapon.length + Math.floor(groups.oneHandWeapon.length / 2)
  )
  for (let count = upper; count > 0; count -= 1) {
    const weapons = feasibleSetPlan(groups, count)
    if (weapons) return { count, weapons }
  }
  return { count: 0, weapons: null }
}

function chooseItems(items, count) {
  return [...items].sort(byLowThenLocation).slice(0, count)
}

function createTargets(setCount, capacity = 1, start = 0, end = setCount) {
  const targets = []
  for (let pass = 0; pass < capacity; pass += 1) {
    for (let setIndex = start; setIndex < end; setIndex += 1) targets.push(setIndex)
  }
  return targets
}

function assignItems(sets, slot, items, targets) {
  const remainingTargets = [...targets]
  for (const item of items) {
    let targetOffset = 0
    if (isLowLevel(item)) {
      const withoutLow = remainingTargets.findIndex((setIndex) => !sets[setIndex].hasLowLevel)
      if (withoutLow >= 0) targetOffset = withoutLow
    }
    const [setIndex] = remainingTargets.splice(targetOffset, 1)
    sets[setIndex].items.push(item)
    sets[setIndex].slots[slot] = [...(sets[setIndex].slots[slot] || []), item]
    if (isLowLevel(item)) sets[setIndex].hasLowLevel = true
  }
}

function buildSets(groups, setCount, weapons) {
  const sets = Array.from({ length: setCount }, (_, index) => ({
    id: `chaos-set-${index + 1}`,
    index,
    items: [],
    slots: {},
    hasLowLevel: false,
    allUnidentified: true
  }))

  for (const slot of SINGLE_SLOTS) {
    assignItems(sets, slot, chooseItems(groups[slot], setCount), createTargets(setCount))
  }
  assignItems(sets, 'ring', chooseItems(groups.ring, setCount * 2), createTargets(setCount, 2))

  const twoHandItems = chooseItems(groups.twoHandWeapon, weapons.twoHandCount)
  const oneHandItems = chooseItems(groups.oneHandWeapon, weapons.oneHandCount)
  assignItems(sets, 'twoHandWeapon', twoHandItems, createTargets(setCount, 1, 0, weapons.twoHandCount))
  assignItems(sets, 'oneHandWeapon', oneHandItems, createTargets(setCount, 2, weapons.twoHandCount, setCount))

  for (const set of sets) {
    set.items.sort((left, right) =>
      PICK_ORDER.indexOf(left.itemClass) - PICK_ORDER.indexOf(right.itemClass) || byLocation(left, right)
    )
    set.allUnidentified = set.items.every((item) => !item.identified)
    set.reward = set.allUnidentified ? 2 : 1
  }
  return sets
}

function slotCounts(groups) {
  return Object.fromEntries(Object.entries(groups).map(([slot, items]) => [slot, items.length]))
}

function missingForNextSet(groups) {
  const missing = {}
  for (const slot of SINGLE_SLOTS) missing[slot] = Math.max(0, 1 - groups[slot].length)
  missing.ring = Math.max(0, 2 - groups.ring.length)
  const weaponCapacity = groups.twoHandWeapon.length + Math.floor(groups.oneHandWeapon.length / 2)
  missing.weapon = Math.max(0, 1 - weaponCapacity)
  missing.lowLevel = Math.max(0, 1 - Object.values(groups).flat().filter(isLowLevel).length)
  return missing
}

export function calculateChaosRecipe(items, options = {}) {
  const candidates = filterChaosCandidates(items, options)
  const groups = groupCandidates(candidates)
  const maximum = maximumSetCount(groups)
  const sets = maximum.count ? buildSets(groups, maximum.count, maximum.weapons) : []
  return {
    candidates,
    counts: slotCounts(groups),
    fullSetCount: sets.length,
    rewardTotal: sets.reduce((sum, set) => sum + set.reward, 0),
    needsLowLevel: sets.length === 0 &&
      SINGLE_SLOTS.every((slot) => groups[slot].length >= 1) &&
      groups.ring.length >= 2 &&
      (groups.twoHandWeapon.length >= 1 || groups.oneHandWeapon.length >= 2) &&
      !Object.values(groups).flat().some(isLowLevel),
    missing: missingForNextSet(groups),
    sets
  }
}

export function createPickingPlan(snapshot, requestedSetCount = 1) {
  const count = Math.max(0, Math.min(
    Math.trunc(Number(requestedSetCount) || 0),
    snapshot?.sets?.length || 0
  ))
  const selectedSets = snapshot.sets.slice(0, count)
  const groups = new Map()
  for (const set of selectedSets) {
    for (const item of set.items) {
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
      groups.get(item.tabId).items.push({ ...item, setId: set.id })
    }
  }
  const tabs = [...groups.values()].sort((left, right) => left.tabIndex - right.tabIndex)
  for (const tab of tabs) tab.items.sort((left, right) =>
    PICK_ORDER.indexOf(left.itemClass) - PICK_ORDER.indexOf(right.itemClass) || byLocation(left, right)
  )
  return {
    id: `chaos-plan-${Date.now()}`,
    setCount: selectedSets.length,
    itemCount: tabs.reduce((sum, tab) => sum + tab.items.length, 0),
    tabs
  }
}
