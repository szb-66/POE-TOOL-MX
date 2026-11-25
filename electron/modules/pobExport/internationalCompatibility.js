import snapshot from '../../assets/pob-export/international.json' with { type: 'json' }

const canonicalBase = name => String(name || '').replace('Maelström Staff', 'Maelstrom Staff')
  .replace(/ \((?:Armour\/Energy Shield|Armour\/Evasion|Evasion\/Energy Shield|Cold\/Lightning|Fire\/Cold|Fire\/Lightning|Cold-To-Fire|Cold-To-Lightning|Fire-To-Cold|Fire-To-Lightning|Lightning-To-Cold|Lightning-To-Fire|Frenzy|Power|Endurance)\)$/, '')
const slotTypes = {
  Amulet: ['Amulet'], Belt: ['Belt'], BodyArmour: ['Body Armour'], Boots: ['Boots'], Gloves: ['Gloves'], Helm: ['Helmet'],
  Ring: ['Ring'], Ring2: ['Ring'], Ring3: ['Ring'], Flask: ['Flask', 'Tincture'], BrequelGrafts: ['Graft'], BrequelGrafts2: ['Graft'],
  Offhand: ['Shield', 'Quiver'], Offhand2: ['Shield', 'Quiver']
}
const bases = new Map()
for (const base of snapshot.bases) {
  const key = canonicalBase(base.en)
  if (!bases.has(key)) bases.set(key, new Set())
  bases.get(key).add(base.type)
}
const uniqueKeys = new Set(snapshot.uniques.map(item => `${item.en.trim()}\0${canonicalBase(item.base)}`))
const canonicalUnique = name => ({ 'Doppelgänger Guise': 'Doppelganger Guise', 'Mjölner': 'Mjolner' }[name] || name)
const foulbornPrefix = 'Foulborn '
const gemNameMap = Object.fromEntries(snapshot.gems.map(gem => [gem.id.includes('/SupportGem') && !gem.en.endsWith(' Support') ? `${gem.en} Support` : gem.en, gem.en]))

export function internationalPobContext(items) {
  const ruthless = /\bRuthless\b/i.test(items.character.league || '')
  const tree = ruthless ? snapshot.ruthless : snapshot
  return {
    ...tree, gemNameMap, gemNames: snapshot.gems.map(gem => gem.en),
    gameVersion: snapshot.gameVersion, treeVersion: ruthless ? '3_30_ruthless' : snapshot.treeVersion,
    nodeIds: new Set(tree.nodes.map(node => node.id)), commit: snapshot.commit
  }
}

export function resolveInternationalItemIdentity(item) {
  const baseType = canonicalBase(item.baseType)
  const types = bases.get(baseType)
  const weapon = type => /(?:Axe|Bow|Claw|Dagger|Rod|Mace|Sceptre|Staff|Sword|Wand)$/i.test(type)
  const allowed = item.abyssJewel || !item.inventoryId ? ['Jewel', 'Abyss Jewel'] : slotTypes[item.inventoryId]
  const weaponSlot = ['Weapon', 'Weapon2', 'Offhand', 'Offhand2'].includes(item.inventoryId)
  if (!types || ![...types].some(type => allowed?.includes(type) || (weaponSlot && weapon(type)) || (!allowed && !weaponSlot))) {
    return { error: `未识别的国际服底材或装备栏：${item.baseType || '缺失'}` }
  }
  if ([3, 9, 10].includes(item.frameType)) {
    const name = canonicalUnique(item.name)
    if (uniqueKeys.has(`${name}\0${baseType}`)) return { name, baseType }
    if (typeof name === 'string' && name.startsWith(foulbornPrefix)) {
      const originalName = canonicalUnique(name.slice(foulbornPrefix.length))
      if (uniqueKeys.has(`${originalName}\0${baseType}`)) return { name: `${foulbornPrefix}${originalName}`, baseType }
    }
    return { error: `未识别的国际服传奇身份：${item.name || '缺失'} / ${baseType}` }
  }
  return { name: item.frameType === 2 || item.name ? 'Item' : '', baseType }
}
