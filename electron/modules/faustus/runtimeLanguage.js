import { createHash } from 'node:crypto'
import { getServer } from '../../../shared/serverMode.js'

const ANCHORS = Object.freeze({
  merchant: ['AsyncTradeStashPanelTitle', 'Merchant'],
  shop: ['AsyncTradeStashTabName', 'Shop'],
  priceTitle: ['AsyncTradeStashPanelPriceItemConfirmationTitle', 'Set Item Price'],
  submit: ['AsyncTradeStashPanelPriceItemConfirmationActionButton', 'List Item']
})
const CN_ANCHORS = Object.freeze({ merchant: ['商人'], shop: ['商店'], priceTitle: ['设置物品价格'], submit: ['上架物品'] })
const CURRENCIES = Object.freeze({ chaos: ['Metadata/Items/Currency/CurrencyRerollRare', 'Chaos Orb'], divine: ['Metadata/Items/Currency/CurrencyModValues', 'Divine Orb'] })
const normalize = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase()

function verified(entry) {
  return entry?.kind === 'dat' && typeof entry.en === 'string' && (!entry.sourceHash || entry.sourceHash === createHash('sha256').update(entry.en).digest('hex'))
}

// The caller supplies only the currently installed, verified resource revision.
export function createFaustusRuntimeLanguage({ server = getServer(), entries = [], revision = '', footprints } = {}) {
  const selected = getServer(server.id)
  if (selected.id === 'cn') return { serverId: 'cn', localizationRevision: '', anchors: CN_ANCHORS, currencies: { chaos: ['混沌石'], divine: ['神圣石'] }, itemBaseAliases: {} }
  const active = revision ? entries.filter(verified) : []
  const aliases = (table, id, field, english) => {
    const records = active.filter(entry => entry.table.toLowerCase() === table && entry.id === id && entry.field === field && entry.en === english)
    return [...new Set([english, ...records.flatMap(entry => [entry.cn, entry.tw]).filter(Boolean)])]
  }
  const anchors = Object.fromEntries(Object.entries(ANCHORS).map(([key, [id, en]]) => [key, aliases('clientstrings2', id, 'Text', en)]))
  const currencies = Object.fromEntries(Object.entries(CURRENCIES).map(([key, [id, en]]) => [key, aliases('baseitemtypes', id, 'Name', en)]))
  const currencyOwners = new Map()
  for (const [code, names] of Object.entries(currencies)) for (const name of names) {
    const key = normalize(name)
    if (currencyOwners.has(key) && currencyOwners.get(key) !== code) throw new Error('当前汉化通货名称存在歧义，无法开始浮士德改价')
    currencyOwners.set(key, code)
  }
  const candidates = new Map()
  const register = (alias, english) => {
    if (!alias) return
    const key = normalize(alias)
    if (!candidates.has(key)) candidates.set(key, { alias, values: new Set() })
    candidates.get(key).values.add(String(english).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase())
  }
  // Include known English bases for single-line magic names without inferring dimensions.
  for (const key of Object.keys(footprints?.items || {})) {
    const name = key.split('\u001f')[1]
    if (name) register(name, name)
  }
  for (const entry of active) if (entry.table.toLowerCase() === 'baseitemtypes' && entry.field === 'Name') {
    for (const alias of [entry.en, entry.cn, entry.tw]) register(alias, entry.en)
  }
  const itemBaseAliases = Object.fromEntries([...candidates.values()].map(({ alias, values }) => [alias, values.size === 1 ? [...values][0] : null]))
  return { serverId: selected.id, localizationRevision: revision, anchors, currencies, itemBaseAliases }
}
