import { load } from 'cheerio'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { sanctumRule } from '../../electron/modules/sanctum/catalog.js'

export const INTERNATIONAL_SANCTUM_PATCH = '3.30.0'
const digest = text => createHash('sha256').update(text).digest('hex')
const reviews = JSON.parse(readFileSync(new URL('./internationalCatalogReviews.json', import.meta.url), 'utf8'))
const numbers = text => text.replace(/接下来\s*1\s*个房间/g, 'next room').match(/\d+(?:\.\d+)?/g)?.sort((a,b) => Number(a)-Number(b)).join('|') || ''
const roomTypes = { MerchantIcon: 'merchant', LyciaPactIcon: 'pact', HealingFountainIcon: 'fountain', CurseFountainIcon: 'fountain', BoonFountainIcon: 'fountain', RainbowFountainIcon: 'fountain', CurrencyRewardIcon: 'reward', TreasureIcon: 'treasure', MinorTreasureIcon: 'treasure' }

function rows(html, language) {
  const $ = load(html), result = []
  if (!$('a[title="Covens v3.30"]').length) throw new Error('圣所来源缺少当前 3.30 赛季标识')
  for (const [section, kind] of [[language === 'en' ? 'Boon' : '恩赐', 'boon'], ['Affliction', 'affliction'], ['Rooms', 'room']]) {
    $(`[id="${section}"] .flex-grow-1`).each((index, element) => {
      const node = $(element), name = node.contents().filter((_, child) => child.type === 'text').first().text().trim()
      const icon = node.parent().find('img').first().attr('alt') || ''
      const descriptions = node.find('.explicitMod').map((_, child) => $(child).text().trim()).get()
      const label = node.children('div').not('.explicitMod').first().text().trim()
      const tier = /^(?:Major|主要)/i.test(label) ? 'major' : /^(?:Minor|次要)/i.test(label) ? 'minor' : null
      if (name) result.push({ kind, name, icon, descriptions, tier, row: index })
    })
    if (!result.some(entry => entry.kind === kind)) throw new Error(`圣所来源缺少 ${section} 数据表`)
  }
  return { $, result }
}

// Both language rows come from the same current source, with icon, tier and
// numeric structure checked before reusing an already implemented mechanic.
export function createInternationalSanctumCatalog({ englishHtml, chineseHtml, fetchedAt, patch = INTERNATIONAL_SANCTUM_PATCH }) {
  if (patch !== INTERNATIONAL_SANCTUM_PATCH || !Number.isFinite(Date.parse(fetchedAt))) throw new Error('国际服圣所版本或采集时间无效')
  const en = rows(englishHtml, 'en'), cn = rows(chineseHtml, 'cn')
  if (en.result.length !== cn.result.length) throw new Error('圣所中英来源行数不一致')
  const entries = [], seen = new Set()
  for (let index = 0; index < en.result.length; index++) {
    const value = en.result[index], translated = cn.result[index]
    if (value.kind !== translated.kind || value.icon !== translated.icon || value.tier !== translated.tier || value.descriptions.length !== translated.descriptions.length || value.descriptions.some((text, i) => numbers(text) !== numbers(translated.descriptions[i]))) throw new Error(`圣所中英来源结构或数值不一致：${value.kind}/${value.name}/${translated.name}`)
    const semantic = JSON.stringify({ name: value.name, descriptions: value.descriptions })
    const id = `${value.kind}:${value.icon || value.name.replace(/[^a-z0-9]+/gi, '-')}:${digest(semantic).slice(0, 16)}`
    if (seen.has(id)) continue
    seen.add(id)
    const candidateRules = translated.descriptions.map(sanctumRule)
    const englishSha256 = digest(semantic)
    const chineseSha256 = digest(JSON.stringify({ name: translated.name, descriptions: translated.descriptions }))
    const review = reviews.entries[id]
    const reviewed = reviews.patch === patch && review?.englishSha256 === englishSha256
      && review.chineseSha256 === chineseSha256 && review.rulesSha256 === digest(JSON.stringify(candidateRules))
    const rules = reviewed && review.supported ? candidateRules : candidateRules.map(() => null)
    entries.push({ id, kind: value.kind, name: value.name, aliases: [], descriptions: value.descriptions,
      ...(value.tier ? { tier: value.tier } : {}),
      ...(reviewed && review.supported && roomTypes[value.icon] ? { roomType: roomTypes[value.icon] } : {}),
      rules, sourceId: 'poedb-sanctum-us', applicability: reviewed ? 'current' : 'unverified', reviewedPatch: reviewed ? patch : null,
      ruleSupport: !reviewed ? 'unreviewed' : rules.length && rules.every(Boolean) ? 'supported' : value.kind === 'room' ? 'name-and-type' : 'unsupported',
      reviewEvidence: { method: reviews.method, englishSha256, chineseSha256,
        status: !reviewed ? 'content-changed-or-unreviewed' : review.supported ? 'supported' : 'unsupported',
        ...(reviewed && review.reason ? { reason: review.reason } : {}) } })
  }
  en.$('#Rewards tbody tr').each((index, element) => {
    const node = en.$(element).find('td').first(), link = node.find('a').first()
    const name = link.text().trim() || node.text().trim()
    if (!name) return
    entries.push({ id: `reward:${link.attr('href') || digest(name).slice(0,16)}`, kind: 'reward', name, aliases: [], descriptions: [name], sourceId: 'poedb-sanctum-us', applicability: 'current', reviewedPatch: patch })
  })
  en.$('#Floors .flex-grow-1').each((index, element) => {
    const name = en.$(element).contents().filter((_, child) => child.type === 'text').first().text().trim()
    entries.push({ id: `floor:${index}`, kind: 'floor', name, aliases: [], descriptions: [], sourceId: 'poedb-sanctum-us', applicability: 'current', reviewedPatch: patch })
  })
  if (!entries.some(entry => entry.kind === 'reward') || new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('国际服圣所目录不完整或标识重复')
  return { schemaVersion: 1, game: 'poe1', server: 'international', language: 'en', patch, generatedAt: fetchedAt,
    versionEvidence: { patch, sentinel: 'Covens v3.30', scope: 'current data tables; historical article excluded' },
    sources: [{ id: 'poedb-sanctum-us', url: 'https://poedb.tw/us/Sanctum_league', fetchedAt, channel: 'official', sha256: digest(englishHtml) },
      { id: 'poedb-sanctum-cn-reference', url: 'https://poedb.tw/cn/Sanctum_league', fetchedAt, channel: 'official', sha256: digest(chineseHtml) }], entries }
}
