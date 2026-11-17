import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LocalizationDownloader } from '../electron/modules/localization/downloader.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().normalize('NFKC').toLowerCase()
const word = value => /[\p{Script=Latin}\p{N}_]/u.test(value || '')

// Index once: auditing every modifier must not repeatedly scan every translated base name.
function baseNameIndex(entries) {
  const trie = new Map()
  for (const entry of entries.filter(entry => entry.table === 'baseitemtypes' && entry.field === 'Name')) {
    for (const alias of [entry.en, entry.cn, entry.tw].map(normalize).filter(Boolean)) {
      let node = trie
      for (const letter of alias) {
        if (!node.has(letter)) node.set(letter, new Map())
        node = node.get(letter)
      }
      if (!node.has(null)) node.set(null, new Set())
      node.get(null).add(entry.en)
    }
  }
  return value => {
    const text = normalize(value), hits = new Set()
    for (let start = 0; start < text.length; start++) {
      let node = trie
      for (let end = start; end < text.length && (node = node.get(text[end])); end++) {
        if (!node.has(null) || (word(text[start]) && word(text[start - 1])) || (word(text[end]) && word(text[end + 1]))) continue
        for (const name of node.get(null)) hits.add(name)
      }
    }
    return [...hits]
  }
}

export function auditCraftingLocalization(entries, revision, { maxSamples = 10000 } = {}) {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => revision })
  runtime.current()
  const bases = new Map(entries.filter(entry => entry.table === 'baseitemtypes' && entry.field === 'Name').map(entry => [entry.en, entry]))
  const collisions = baseNameIndex(entries), samples = [], seen = new Set()
  const classes = { 'Diamond Flask': 'Utility Flasks', 'Divine Life Flask': 'Life Flasks', Skean: 'Daggers', 'Coral Ring': 'Rings', 'Royal Burgonet': 'Helmets', 'Imperial Skean': 'Daggers' }
  const sourceModifiers = entries.filter(entry => entry.table === 'mods' && entry.field === 'Name')
  const skipped = { inactiveResourceRows: sourceModifiers.filter(entry => /^\[UNUSED\]/.test(entry.en)).length,
    enchantmentResourceRows: sourceModifiers.filter(entry => /^(?:Enchantment|BlightEnchantment)/.test(entry.en)).length,
    invalidNameAliases: 0 }
  const modifiers = sourceModifiers.filter(entry =>
    !/^(?:Enchantment|BlightEnchantment|\[UNUSED\])/.test(entry.en) && entry.en.length < 45)
  const nameCases = []
  for (const modifier of modifiers) for (const locale of ['en', 'cn', 'tw']) {
    const alias = modifier[locale]
    if (!alias) continue
    if (/["{}:：\r\n]/.test(alias)) { skipped.invalidNameAliases++; continue }
    const key = `${locale}\0${alias}`
    if (seen.has(key)) continue
    seen.add(key)
    const hits = collisions(alias)
    nameCases.push({ modifier, locale, alias, hits, flask: /^Flask/.test(modifier.id) })
  }
  const risky = nameCases.filter(value => value.hits.length)
  // Round-robin locales so the bounded audit includes English, Chinese and mixed paths.
  const queues = ['en', 'cn', 'tw'].map(locale => [...risky.filter(value => value.locale === locale), ...nameCases.filter(value => value.locale === locale && value.flask && !value.hits.length)])
  const names = Object.keys(classes)
  for (let round = 0; samples.length < maxSamples && queues.some(queue => queue[round]); round++) {
    for (const queue of queues) {
      const value = queue[round]
      if (!value || samples.length >= maxSamples) continue
      const { modifier, locale, alias } = value
      const expected = value.flask ? names[round % 2] : names[2 + round % 4]
      const base = bases.get(expected)
      if (!base) continue
      const mixed = round % 3 === 2
      const baseName = mixed ? base.en : base[locale] || base.en
      const suffix = modifier.en.startsWith('of ')
      const name = locale === 'en' ? suffix ? `${baseName} ${alias}` : `${alias} ${baseName}` : `${alias}${baseName}`
      const text = `Item Class: ${classes[expected]}\nRarity: Magic\n${name}\n--------\nItem Level: 84\n--------\n{ ${suffix ? 'Suffix' : 'Prefix'} Modifier "${alias}" (Tier: 1) }`
      samples.push({ origin: 'synthetic-name', name, expected, locale, mixed, modifierId: modifier.id, text })
    }
  }
  for (const filename of ['crafting-diamond-flask.txt', 'crafting-hydra-flask.txt']) {
    const text = fs.readFileSync(path.join(root, 'test/fixtures', filename), 'utf8')
    samples.push({ origin: 'reported-clipboard', name: text.split(/\r?\n/)[2], expected: 'Diamond Flask', text })
  }
  const prefix = entries.find(entry => entry.table === 'mods' && entry.id === 'FlaskExtraCharges1')
  const suffix = entries.find(entry => entry.table === 'mods' && entry.id === 'FlaskIgniteImmunityDuringEffect3')
  if (prefix && suffix) for (const locale of ['en', 'cn', 'tw']) for (const mixed of [false, true]) {
    const before = prefix[locale] || prefix.en
    const after = mixed ? suffix.en : suffix[locale] || suffix.en
    const base = mixed ? 'Diamond Flask' : bases.get('Diamond Flask')?.[locale] || 'Diamond Flask'
    const name = locale === 'cn' && !mixed ? `${before}${after}${base}` : `${before} ${base} ${after}`
    samples.push({ origin: 'synthetic-pair', name, expected: 'Diamond Flask', locale, mixed,
      text: `Item Class: Utility Flasks\nRarity: Magic\n${name}\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "${before}" (Tier: 1) }\n{ Suffix Modifier "${after}" (Tier: 1) }` })
  }
  samples.push({ origin: 'negative-control', name: 'Imperial Skean and Skean', expectedError: true,
    text: 'Item Class: Daggers\nRarity: Magic\nImperial Skean and Skean\n--------\nItem Level: 84' })
  for (const [expected, modifier, category] of [['Cerulean Ring', 'Cerulean', 'Rings'], ['Honed Cleaver', 'Honed', 'Two Hand Axes']]) {
    if (!bases.has(expected) || !modifiers.some(entry => entry.en === modifier)) continue
    samples.push({ origin: 'synthetic-explicit-base', name: `${modifier} ${expected}`, expected, locale: 'en',
      text: `Item Class: ${category}\nRarity: Magic\n${modifier} ${expected}\n${expected}\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "${modifier}" (Tier: 1) }` })
  }
  const failures = []
  for (const sample of samples) {
    const { text, ...metadata } = sample
    try {
      const item = runtime.parseItem(text, revision)
      if (sample.expectedError || item?.baseName !== sample.expected) failures.push({ ...metadata, actual: item?.baseName || null })
    } catch (error) {
      if (!sample.expectedError) failures.push({ ...metadata, error: error.message, code: error.code })
    }
  }
  const countBy = field => Object.fromEntries([...new Set(samples.map(sample => sample[field] || 'original'))]
    .map(value => [value, samples.filter(sample => (sample[field] || 'original') === value).length]))
  return { resourceEntryCount: entries.length, distinctModifierAliases: nameCases.length, aliasesContainingBaseNames: risky.length,
    skipped, coverage: { origin: countBy('origin'), locale: countBy('locale'), mixedNameSamples: samples.filter(sample => sample.mixed).length },
    tested: samples.length, passed: samples.length - failures.length, failureCount: failures.length, failures }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const storageRoot = process.argv[2] || path.join(process.env.APPDATA, '流放助手', 'servers/international/localization')
  const bundle = new LocalizationDownloader({ storageRoot, publicKeyFile: path.join(root, 'electron/assets/localization-public-key.pem') }).load()
  if (!bundle) throw new Error('当前签名词库不可用，无法运行制作名称审计')
  const report = auditCraftingLocalization(bundle.entries, bundle.manifest.releaseId)
  console.log(JSON.stringify({ ...report, failures: report.failures.slice(0, 20) }, null, 2))
  if (report.failures.length) process.exitCode = 1
}
