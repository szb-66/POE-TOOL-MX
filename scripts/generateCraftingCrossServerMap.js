import { createHash } from 'node:crypto'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { load } from 'cheerio'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { parsePoedbEldritchImplicits } from '../electron/modules/crafting/poedbParser.js'

function cleanEffectPattern(text = '') {
  return String(text)
    .replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—–-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
    .replace(/[+\-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .trim()
}

function tierSignature(tiers = []) {
  return tiers
    .map(tier => `${tier.tier}:${tier.requiredLevel}:${(tier.values || []).map(v => `${v.min}-${v.max}`).join(',')}`)
    .join('|')
}

function modifierKey(mod) {
  return [
    mod.modifierProfileId || '',
    mod.groupId || '',
    mod.affixType || '',
    mod.source || '',
    (mod.influences || []).join(','),
    tierSignature(mod.tiers)
  ].join('|')
}

function extractEldritchRows(html) {
  const $ = load(html)
  const tables = $('table').filter((_, table) => $(table).find('tbody tr').length >= 6).slice(0, 2)
  const rows = []
  tables.each((tableIndex, table) => {
    const source = tableIndex === 0 ? 'exarch' : 'eater'
    $(table).find('tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return
      const level = cells.eq(0).text().trim()
      const tierMatch = (cells.eq(2).html() || '').match(/no_tier_(\d)_eldritch_implicit/i)
      const tier = tierMatch ? 7 - Number(tierMatch[1]) : 0
      const text = (cells.eq(1).find('.implicitMod').first().html() || cells.eq(1).html() || '')
        .replace(/<br\s*\/?>/gi, '\n')
      const q = load(text)
      const cleaned = q.root().text().split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
      rows.push({ source, level, tier, text: cleaned })
    })
  })
  return rows
}

function eldritchEffectKey(text) {
  let key = cleanEffectPattern(text)
  if (!key.includes('chance to')) {
    key = key
      .replace('Attacks always Maim on Hit', 'Attacks have #% chance to Maim on Hit')
      .replace('Hinder Enemies on Hit with Spells', '#% chance to Hinder Enemies on Hit with Spells')
      .replace('Intimidate Enemies for # seconds on Hit', '#% chance to Intimidate Enemies for # seconds on Hit')
      .replace('Unnerve Enemies for # seconds on Hit', '#% chance to Unnerve Enemies for # seconds on Hit')
  }
  if (!key.includes('几率')) {
    key = key
      .replace('攻击击中造成瘫痪', '攻击击中时有 #% 的几率造成瘫痪')
      .replace('在法术击中时使敌人缓速', '有 #% 的几率在法术击中时使敌人缓速')
      .replace('击中时恐惧敌人', '击中时有 #% 的几率恐惧敌人')
      .replace('击中威吓敌人', '击中有 #% 的几率威吓敌人')
  }
  return key
}

async function main() {
  const cnRaw = JSON.parse(await readFile(new URL('../electron/assets/crafting-data/dataset.json', import.meta.url), 'utf8'))
  const enRaw = JSON.parse(await readFile(new URL('../electron/assets/crafting-data-international/dataset.json', import.meta.url), 'utf8'))
  const cn = normalizeCraftingDataset(cnRaw)
  const en = normalizeCraftingDataset(enRaw)

  // 1. Pair modifiers by exact structural signature
  const enByKey = new Map()
  for (const mod of en.modifiers) {
    const key = modifierKey(mod)
    if (!enByKey.has(key)) enByKey.set(key, [])
    enByKey.get(key).push(mod)
  }

  const cnToEn = new Map()
  const enToCn = new Map()
  let pairedMods = 0

  for (const mod of cn.modifiers) {
    const key = modifierKey(mod)
    const hits = enByKey.get(key)
    if (!hits || hits.length !== 1) continue
    const cnPattern = cleanEffectPattern(mod.effectKey || mod.name || mod.tiers?.[0]?.text)
    const enPattern = cleanEffectPattern(hits[0].effectKey || hits[0].name || hits[0].tiers?.[0]?.text)
    if (!cnPattern || !enPattern) continue
    pairedMods += 1
    if (!cnToEn.has(cnPattern)) cnToEn.set(cnPattern, enPattern)
    if (!enToCn.has(enPattern)) enToCn.set(enPattern, cnPattern)
  }

  // Secondary pass: group-level match when single family per (modifierProfileId, groupId, affixType, source, influences)
  const modBroadKey = mod => [mod.modifierProfileId, mod.groupId, mod.affixType, mod.source, (mod.influences || []).join(',')].join('|')
  const enByBroad = new Map()
  const cnByBroad = new Map()
  for (const mod of en.modifiers) {
    const k = modBroadKey(mod)
    if (!enByBroad.has(k)) enByBroad.set(k, [])
    enByBroad.get(k).push(mod)
  }
  for (const mod of cn.modifiers) {
    const k = modBroadKey(mod)
    if (!cnByBroad.has(k)) cnByBroad.set(k, [])
    cnByBroad.get(k).push(mod)
  }
  for (const [k, cnList] of cnByBroad) {
    const enList = enByBroad.get(k)
    if (!enList || cnList.length !== 1 || enList.length !== 1) continue
    const cnPattern = cleanEffectPattern(cnList[0].effectKey || cnList[0].name || cnList[0].tiers?.[0]?.text)
    const enPattern = cleanEffectPattern(enList[0].effectKey || enList[0].name || enList[0].tiers?.[0]?.text)
    if (cnPattern && enPattern) {
      if (!cnToEn.has(cnPattern)) cnToEn.set(cnPattern, enPattern)
      if (!enToCn.has(enPattern)) enToCn.set(enPattern, cnPattern)
    }
  }

  // 2. Pair Eldritch Implicits 100% via row-aligned 3.30.0 HTML tables
  const cnManifest = JSON.parse(await readFile(new URL('../electron/assets/crafting-raw/3.30.0/manifest.json', import.meta.url), 'utf8'))
  const eldEntry = cnManifest.sources.find(s => s.id === 'implicit:eldritch')
  const cnEldHtml = gunzipSync(await readFile(new URL(`../electron/assets/crafting-raw/3.30.0/${eldEntry.file}`, import.meta.url))).toString('utf8')
  const enEldHtml = await readFile(new URL('../.cache/international-crafting/3.30.0/Eldritch_implicit.html', import.meta.url), 'utf8')

  const cnRows = extractEldritchRows(cnEldHtml)
  const enRows = extractEldritchRows(enEldHtml)
  if (cnRows.length !== enRows.length) {
    throw new Error(`古灵隐式行数不匹配：CN=${cnRows.length}, EN=${enRows.length}`)
  }

  const cnEldFamilies = parsePoedbEldritchImplicits(cnEldHtml)
  const enEldFamilies = parsePoedbEldritchImplicits(enEldHtml)
  const cnEldByKey = new Map(cnEldFamilies.map(f => [`${f.source}:${cleanEffectPattern(f.effectKey)}:${f.itemClasses.join(',')}`, f]))
  const enEldByKey = new Map(enEldFamilies.map(f => [`${f.source}:${cleanEffectPattern(f.effectKey)}:${f.itemClasses.join(',')}`, f]))

  const eldPatternPairs = new Map()
  for (let i = 0; i < cnRows.length; i += 1) {
    const c = cnRows[i]
    const e = enRows[i]
    if (c.source !== e.source || c.tier !== e.tier) continue
    const cnPat = eldritchEffectKey(c.text)
    const enPat = eldritchEffectKey(e.text)
    if (!cnPat || !enPat) continue
    const pairKey = `${c.source}\u0000${cnPat}`
    if (!eldPatternPairs.has(pairKey)) eldPatternPairs.set(pairKey, enPat)
  }

  const eldritchPairs = []
  const seenEld = new Set()
  for (const cnFam of cnEldFamilies) {
    const cnPat = cleanEffectPattern(cnFam.effectKey)
    const enPat = eldPatternPairs.get(`${cnFam.source}\u0000${cnPat}`)
    if (!enPat) continue
    const enFam = enEldByKey.get(`${cnFam.source}:${enPat}:${cnFam.itemClasses.join(',')}`)
    if (!enFam) continue
    const canonicalKey = `eldritch:${createHash('sha256').update(`${enFam.source}:${enPat}:${enFam.itemClasses.join(',')}`).digest('hex').slice(0, 16)}`
    if (seenEld.has(canonicalKey)) continue
    seenEld.add(canonicalKey)
    eldritchPairs.push({
      canonicalKey,
      source: enFam.source,
      itemClasses: enFam.itemClasses,
      cnFamilyId: cnFam.id,
      enFamilyId: enFam.id,
      cnPattern: cnPat,
      enPattern: enPat
    })
  }

  const payload = {
    schemaVersion: 1,
    patch: '3.30.0',
    generatedAt: new Date().toISOString(),
    modifiers: {
      cnToEn: Object.fromEntries([...cnToEn.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))),
      enToCn: Object.fromEntries([...enToCn.entries()].sort((a, b) => a[0].localeCompare(b[0], 'en')))
    },
    eldritch: eldritchPairs
  }

  const target = new URL('../electron/assets/crafting-cross-server-map.json', import.meta.url)
  await writeFile(new URL(`${target.href}.next`), `${JSON.stringify(payload, null, 2)}\n`)
  await rename(new URL(`${target.href}.next`), target)
  console.log(`Generated crafting cross-server map: ${pairedMods} modifier instances -> ${cnToEn.size} CN->EN / ${enToCn.size} EN->CN patterns, ${eldritchPairs.length}/${cnEldFamilies.length} eldritch families`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
