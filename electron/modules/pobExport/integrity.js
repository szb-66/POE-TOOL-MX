import { DATA } from 'cn-poe-utils/data/poe'
import { pobIdentities } from './compatibility.js'

const categories = ['amulets', 'belts', 'bodyArmours', 'boots', 'flasks', 'gloves', 'helmets', 'jewels', 'quivers', 'rings', 'shields', 'tinctures', 'weapons']
const slotCategories = { Amulet: ['amulets'], Belt: ['belts'], BodyArmour: ['bodyArmours'], Boots: ['boots'], Gloves: ['gloves'], Helm: ['helmets'], Ring: ['rings'], Ring2: ['rings'], Flask: ['flasks', 'tinctures'], Weapon: ['weapons'], Weapon2: ['weapons'], Offhand: ['weapons', 'shields', 'quivers'], Offhand2: ['weapons', 'shields', 'quivers'] }
const byBase = new Map()
Object.assign(slotCategories, { Ring3: ['rings'], BrequelGrafts: ['grafts'], BrequelGrafts2: ['grafts'] })
const canonicalBase = name => name.replace('Maelström Staff', 'Maelstrom Staff')
for (const category of categories) {
  for (const base of DATA[category]) {
    for (const name of new Set([base.zh, base.en])) {
      if (!byBase.has(name)) byBase.set(name, [])
      byBase.get(name).push({ ...base, en: canonicalBase(base.en), category: base.itemType === 'Graft' ? 'grafts' : category })
    }
  }
}
const gemNames = new Set(pobIdentities.gemNames)
export const hasChinese = value => /\p{Script=Han}/u.test(value || '')
export const modFields = ['enchantMods', 'implicitMods', 'explicitMods', 'craftedMods', 'fracturedMods', 'crucibleMods', 'mutatedMods', 'utilityMods', 'scourgeMods']
export const itemLabel = item => [item.name, item.baseType].filter(Boolean).join(' ') || '无名称物品'
export const isEquipment = item => !['MainInventory', 'ExpandedMainInventory'].includes(item.inventoryId) && !['赏金猎人饰品', 'THIEFS_TRINKET'].includes(item.baseType)

export function resolveItemIdentity(item, basic) {
  const allowed = item.abyssJewel || !item.inventoryId ? ['jewels'] : slotCategories[item.inventoryId]
  const bases = (byBase.get(item.baseType) || []).filter(b => !allowed || allowed.includes(b.category))
  if (!bases.length) return { error: `未识别底材：${itemLabel(item)}` }
  if ([3, 9, 10].includes(item.frameType)) {
    const mutated = basic.mutatedUniqueNameTranslator.parseZh(item.name || '')
    const name = mutated?.get(0) ?? item.name
    const candidates = new Map()
    for (const b of bases) {
      for (const u of b.uniques || []) {
        if (u.zh !== name && u.en !== name) continue
        if (u.matchMods) {
          const mods = modFields.flatMap(field => item[field] || []).map(mod => basic.transMod(mod) || mod)
          if (!u.matchMods.every(pattern => mods.some(mod => new RegExp(pattern).test(mod)))) continue
        }
        candidates.set(`${b.en}\0${u.en}`, { name: mutated ? basic.mutatedUniqueNameTranslator.renderEn([u.en]) : u.en, baseType: b.en })
      }
    }
    if (candidates.size !== 1) return { error: `${candidates.size ? '传奇身份存在歧义' : '未识别传奇身份'}：${itemLabel(item)}` }
    return [...candidates.values()][0]
  }
  const names = new Set(bases.map(b => b.en))
  if (names.size !== 1) return { error: `底材存在歧义：${itemLabel(item)}` }
  return { name: item.frameType === 2 || item.name ? 'Item' : '', baseType: [...names][0] }
}

export function normalizeAndInspect(items, passive, issues) {
  const validObject = item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) return true
    issues.push('装备、技能或珠宝数据格式无效')
    return false
  }
  items.items = items.items.filter(validObject)
  passive.items = passive.items.filter(validObject)
  function inspect(item, parent) {
    const label = itemLabel(item)
    for (const field of ['properties', 'requirements']) {
      if (item[field] && (!Array.isArray(item[field]) || item[field].some(prop => !prop || typeof prop.name !== 'string' || !Array.isArray(prop.values)))) {
        issues.push(`属性或需求数据格式无效：${label} / ${field}`)
        item[field] = []
      }
    }
    for (const [field, values] of Object.entries(item)) {
      if (!field.endsWith('Mods')) continue
      if (!Array.isArray(values)) { issues.push(`词缀数据格式无效：${label} / ${field}`); item[field] = []; continue }
      item[field] = values.map(mod => {
        if (typeof mod === 'string') return mod
        if (typeof mod?.description === 'string') return mod.description
        issues.push(`词缀数据格式无法识别：${label} / ${field}`)
        return ''
      })
    }
    if (parent) {
      if (!Number.isInteger(item.socket) || !parent.sockets?.[item.socket]) issues.push(`技能或珠宝插槽数据不完整：${label}`)
      if (item.abyssJewel && parent.sockets?.[item.socket]?.sColour !== 'A') issues.push(`深渊珠宝与插槽类型不一致：${label}`)
    }
    if (parent && !item.abyssJewel) {
      const level = item.properties?.find(prop => ['等级', 'Level'].includes(prop.name))?.values?.[0]?.[0]
      // The realm returns values such as "21(最高等级)". Parse the numeric
      // field independently of its localized parenthetical display annotation.
      if (!/^\d+(?:\s*[（(][^\d()（）]+[）)])?\s*$/u.test(String(level)) || parseInt(level) < 1) issues.push(`技能等级数据不完整：${label}`)
      const qualityProperty = item.properties?.find(prop => ['品质', 'Quality'].includes(prop.name))
      const quality = qualityProperty?.values?.[0]?.[0]
      if (qualityProperty && !/^\+?\d+%(?:\s.*)?$/.test(String(quality))) issues.push(`技能品质数据无效：${label}`)
    } else {
      if (![0, 1, 2, 3, 9, 10].includes(item.frameType)) issues.push(`装备稀有度数据无效：${label}`)
      if (!item.id || !Number.isInteger(item.ilvl)) issues.push(`装备标识或物品等级缺失：${label}`)
    }
    if (item.sockets && (!Array.isArray(item.sockets) || item.sockets.some(s => !Number.isInteger(s?.group) || !['R', 'G', 'B', 'W', 'A', 'DV'].includes(s?.sColour)))) issues.push(`插槽连接数据无效：${label}`)
    if (item.socketedItems && !Array.isArray(item.socketedItems)) { issues.push(`镶嵌数据格式无效：${label}`); item.socketedItems = []; return }
    if (item.socketedItems) item.socketedItems = item.socketedItems.filter(validObject)
    const occupied = new Set()
    for (const child of item.socketedItems || []) {
      if (occupied.has(child.socket)) issues.push(`多个技能或珠宝占用同一插槽：${label}`)
      occupied.add(child.socket)
      inspect(child, item)
    }
  }
  for (const item of [...items.items.filter(isEquipment), ...passive.items]) inspect(item)
}

export function checkTranslatedGem(gem, issues) {
  const name = pobIdentities.gemNameMap[gem.baseType] ?? gem.baseType
  if (!name || hasChinese(name) || !gemNames.has(name)) issues.push(`未识别的技能：${itemLabel(gem)}`)
  if (gem.hybrid && (!gem.hybrid.baseTypeName || hasChinese(gem.hybrid.baseTypeName))) issues.push(`未识别的混合技能：${gem.hybrid.baseTypeName || itemLabel(gem)}`)
  if (gem.builtInSupport && !/^Supported by Level \d+ .+/.test(gem.builtInSupport)) issues.push(`未识别的内置辅助技能：${gem.builtInSupport}`)
}

export function preserveExtraMods(item, warnings) {
  for (const [field, mods] of Object.entries(item)) {
    // Cosmetic descriptions do not affect the build and are not PoB modifiers.
    if (field === 'cosmeticMods' || !field.endsWith('Mods') || !Array.isArray(mods) || !mods.length) continue
    if (!modFields.includes(field)) warnings.push(`未识别词缀类别 ${field}，已保留原文，可能影响 PoB 计算。`)
    if (['utilityMods', 'scourgeMods'].includes(field) || !modFields.includes(field)) item.explicitMods = [...(item.explicitMods || []), ...mods]
  }
  const abyssSockets = (item.sockets || []).filter(socket => socket.sColour === 'A').length
  const serializedMods = modFields.filter(field => !['utilityMods', 'scourgeMods'].includes(field)).flatMap(field => item[field] || [])
  if (abyssSockets && !serializedMods.some(mod => /^Has \d+ Abyssal Sockets?$/m.test(mod))) {
    // PoB rebuilds abyss slots from modifiers when loading XML, not from the
    // Sockets line alone. The API socket array is authoritative even if its
    // corresponding modifier is absent or untranslated.
    item.explicitMods = [...(item.explicitMods || []), `Has ${abyssSockets} Abyssal Sockets`]
  }
  for (const child of item.socketedItems || []) if (child.abyssJewel) preserveExtraMods(child, warnings)
}

export function inspectBuilding(building, items, passive, expectedNodes, issues) {
  const equipment = items.items.filter(isEquipment)
  const expectedItems = [...equipment, ...passive.items, ...equipment.flatMap(item => (item.socketedItems || []).filter(x => x.abyssJewel))]
  if (building.items.itemList.length !== expectedItems.length) issues.push('转换后装备或珠宝数量不一致')
  const expectedGems = equipment.flatMap(item => (item.socketedItems || []).filter(x => !x.abyssJewel))
  const actualGems = building.skills.skillSet.skills.flatMap(group => group.gems)
  if (actualGems.length !== expectedGems.length) issues.push('转换后技能数量不一致')
  for (let i = 0; i < expectedGems.length; i++) {
    const expected = expectedGems[i]
    const actual = actualGems[i]
    if (!actual) continue
    // PoB deliberately calls Barrage's support "Barrage Support" to distinguish
    // the active gem. Upstream removes every Support suffix indiscriminately.
    if (!expected.hybrid?.isVaalGem) actual.nameSpec = pobIdentities.gemNameMap[expected.baseType] ?? actual.nameSpec
    const level = expected.properties?.find(x => x.name === 'Level')?.values?.[0]?.[0]
    const quality = expected.properties?.find(x => x.name === 'Quality')?.values?.[0]?.[0] ?? '0'
    if (actual.level !== parseInt(level) || actual.quality !== parseInt(quality)) issues.push(`转换后技能等级或品质不一致：${expected.baseType}`)
  }
  const actualNodes = new Set(building.tree.spec.nodes)
  if (expectedNodes.some(id => !actualNodes.has(id)) || actualNodes.size < new Set(expectedNodes).size + new Set(passive.hashes_ex).size) issues.push('转换后天赋节点缺失，无法完整导出')
  if (building.tree.spec.sockets.sockets.length !== passive.items.length || building.tree.spec.sockets.sockets.some(s => !Number.isInteger(s.nodeId))) issues.push('当前转换数据无法识别部分珠宝插槽，无法完整导出')
  if (building.tree.spec.overrides.members.length !== Object.keys(passive.skill_overrides).length) issues.push('转换后天赋覆盖数据缺失')
  const actualMasteries = new Map(building.tree.spec.masteryEffects.map(x => [String(x.nodeId), x.effectId]))
  if (Object.entries(passive.mastery_effects).some(([id, effect]) => actualMasteries.get(id) !== effect)) issues.push('转换后专精数据缺失')
  for (const item of building.items.itemList) {
    const model = item.viewModel()
    for (const field of modFields.filter(x => !['utilityMods', 'scourgeMods'].includes(x))) {
      if ((model[field]?.length || 0) !== (item.json[field] || []).flatMap(x => x.split('\n')).length) issues.push(`转换后词缀缺失：${itemLabel(item.json)} / ${field}`)
    }
  }
}
