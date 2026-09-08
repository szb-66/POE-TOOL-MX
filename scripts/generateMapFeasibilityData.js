import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { load } from 'cheerio'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'

export const REPOE_URL = 'https://repoe-fork.github.io/mods.min.json'
export function auditAdditionalRules(mods, bases) {
  const compact = ([id, m]) => ({ id, side: m.generation_type, groups: m.groups, level: m.required_level,
    stats: m.stats, spawnWeights: m.spawn_weights, generationWeights: m.generation_weights, addsTags: m.adds_tags })
  return {
    chartBases: Object.entries(bases).filter(([, b]) => b.item_class === 'DeepwaterChart')
      .map(([id, b]) => ({ id, name: b.name, tags: b.tags, implicits: b.implicits })),
    chartNonAffixes: Object.entries(mods).filter(([, m]) => m.domain === 'deepwater_chart' && !['prefix', 'suffix'].includes(m.generation_type)).map(compact),
    conditionalAtlasAffixes: Object.entries(mods).filter(([, m]) => m.domain === 'area' && ['prefix', 'suffix'].includes(m.generation_type)
      && m.spawn_weights.some(w => w.weight > 0 && w.tag.startsWith('has_uber_map_'))).map(compact)
  }
}
export const SOURCES = [
  ['atlas', 'Maps_low_tier', 5], ['atlas', 'Maps_mid_tier', 5],
  ['atlas', 'Maps_top_tier', 5], ['atlas', 'Maps_uber_tier', 5],
  ['heist', 'Contracts', 22], ['heist', 'Blueprints', 22]
]

export function descriptionLines(html) {
  const $ = load(html || '')
  $('.secondary, .badge').remove()
  $('br').replaceWith('\n')
  return $.root().text().split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export function parseModsView(html, domain) {
  const raw = html.match(/new ModsView\((\{[^\n]+\})\)/)?.[1]
  if (!raw) throw new Error('缺少 ModsView 数据')
  const data = JSON.parse(raw)
  if (data.opt?.ModDomainsID !== domain || !Array.isArray(data.normal)) throw new Error('词缀域不匹配')
  return data.normal.filter(m => Number(m.DropChance) > 0 && ['1', '2'].includes(String(m.ModGenerationTypeID)))
}

export function chartRows(html) {
  const $ = load(html)
  return $('#MapDeepWaterChartMods tbody tr').toArray().map(row => {
    const cells = $(row).children('td')
    return { level: Number(cells.eq(0).text()), side: /前缀|Prefix/.test(cells.eq(1).text()) ? 'prefix' : /后缀|Suffix/.test(cells.eq(1).text()) ? 'suffix' : null,
      lines: descriptionLines(cells.eq(2).html()) }
  }).filter(row => row.side)
}

const textShape = text => text.split('\n').map(s => s.toLowerCase().replace(/grasping vines/g, 'grasping vine').replace(/[^a-z]/g, '')).filter(Boolean).sort().join('|')
export function joinChartRows(english, chinese, mods) {
  if (!english.length || english.length !== chinese.length) throw new Error('海图中英文表格不一致')
  const entries = Object.entries(mods).filter(([, m]) => m.domain === 'deepwater_chart' && ['prefix', 'suffix'].includes(m.generation_type))
  return english.map((row, i) => {
    const cn = chinese[i]
    if (row.level !== cn.level || row.side !== cn.side) throw new Error('海图行身份不一致')
    const primary = row.lines.filter(s => !/in adjacent Areas/.test(s) && !/[+\-]%/.test(s)).join('\n')
    const matches = entries.filter(([, m]) => m.required_level === row.level && m.generation_type === row.side && textShape(m.text || '') === textShape(primary))
    if (matches.length !== 1) throw new Error(`海图身份无法唯一匹配: ${primary} (${matches.length})`)
    return { id: matches[0][0], lines: cn.lines }
  })
}

function record(id, lines, mods) {
  const m = mods[id]
  if (!m || !m.groups?.length || !Array.isArray(m.stats) || !lines.length) throw new Error(`不完整词缀: ${id}`)
  return { id, side: m.generation_type, groups: m.groups, level: m.required_level, lines,
    stats: m.stats, spawnWeights: m.spawn_weights, generationWeights: m.generation_weights, addsTags: m.adds_tags }
}

async function main() {
  const sources = []
  async function get(url) {
    let response
    try { response = await fetch(url, { signal: AbortSignal.timeout(30000) }) }
    catch (error) { throw new Error(`获取来源失败 ${url}: ${error.message}`, { cause: error }) }
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    const html = await response.text()
    sources.push({ url, sha256: createHash('sha256').update(html).digest('hex') })
    return html
  }
  const mods = JSON.parse(await get(REPOE_URL))
  const index = await get('https://repoe-fork.github.io/Traditional%20Chinese/')
  const version = index.match(/PoE version\s+(\d+\.\d+(?:\.\d+)*)/i)?.[1]
  if (!version?.startsWith(`${SEASON_BASELINE.patch}.`)) throw new Error('RePoE 与项目赛季版本不一致')
  const bases = JSON.parse(await get('https://repoe-fork.github.io/base_items.min.json'))
  const additionalRules = auditAdditionalRules(mods, bases)
  const heistBases = Object.entries(bases).filter(([, b]) => ['HeistContract', 'HeistBlueprint'].includes(b.item_class))
  const heistExtras = Object.values(mods).filter(m => (m.domain === 'heist_area' && !['prefix', 'suffix'].includes(m.generation_type)) || (m.domain !== 'heist_area' && m.spawn_weights.some(w => ['heist_contract', 'heist_blueprint'].includes(w.tag) && w.weight > 0)))
  const heistComplete = heistBases.length > 0 && heistBases.every(([, b]) => !b.implicits.length) && heistExtras.length === 0
  const pools = []
  for (const [kind, page, domain] of SOURCES) {
    const sourceUrl = `https://poedb.tw/cn/${page}`
    const raw = parseModsView(await get(sourceUrl), domain)
    const records = raw.map(m => {
      const id = decodeURIComponent(m.hover).split(/[\\/]/).at(-1)
      const displayLines = descriptionLines(m.str)
      // POEDB appends per-affix map reward contributions; copied map explicit
      // modifiers do not include these (they appear in the summed item header).
      const matchLines = kind === 'atlas' ? displayLines.filter(line => !/^(?:该区域物品掉落数量提高|该地图的物品稀有度提高|怪物群规模扩大)\s/.test(line)) : displayLines
      const result = { ...record(id, matchLines, mods), displayLines }
      if (result.side !== (String(m.ModGenerationTypeID) === '1' ? 'prefix' : 'suffix') || result.level !== Number(m.Level) || [...result.groups].sort().join() !== [...m.ModFamilyList].sort().join()) throw new Error(`POEDB/RePoE 不一致: ${id}`)
      return result
    })
    pools.push({ id: page, kind, sourceUrl, maxLevel: 100, prefixLimit: 3, suffixLimit: 3, counts: [4, 5, 6], complete: true,
      mods: records })
  }
  const chartUrl = 'https://poedb.tw/cn/Sandy_Seabed_Chart'
  const cn = chartRows(await get(chartUrl))
  const en = chartRows(await get('https://poedb.tw/us/Sandy_Seabed_Chart'))
  const chart = joinChartRows(en, cn, mods).map(m => record(m.id, m.lines, mods))
  pools.push({ id: 'DeepwaterChart', kind: 'chart', sourceUrl: chartUrl, maxLevel: 100, prefixLimit: 3, suffixLimit: 3, counts: [4, 5, 6], complete: true, mods: chart })
  const result = { schemaVersion: 1, gameVersion: SEASON_BASELINE.patch, sourceGameVersion: version, snapshotDate: new Date().toISOString().slice(0, 10), sources,
    // 普通词缀目录不能证明所有附魔与特殊底子的非品质属性上界。
    // 已找到普通词缀解仍有效；穷尽普通目录失败时必须报告覆盖不足。
    coverage: {
      atlas: { complete: false, reasons: ['灾厄地图条件生成词缀的中文描述与生成顺序尚未完整接入', '附魔及特殊底子的非品质属性修正尚未完整核实'],
        conditionalAffixes: additionalRules.conditionalAtlasAffixes },
      chart: { complete: false, reasons: ['已收录全部海图底子与非前后缀记录；航行属性与洗练面板数值的对应关系尚未核实'],
        bases: additionalRules.chartBases, nonAffixes: additionalRules.chartNonAffixes },
      heist: { complete: heistComplete, reasons: heistComplete ? [] : ['契约蓝图出现尚未核实的隐式或额外生成规则'],
        bases: heistBases.map(([id, b]) => ({ id, tags: b.tags, implicits: b.implicits })),
        quality: { maximum: 0, reason: 'HeistContract / HeistBlueprint 不属于地图品质通货适用的 Map 类别' } }
    }, pools }
  await writeFile(new URL('../src/data/mapFeasibilityData.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
  console.log(pools.map(p => `${p.id}: ${p.mods.length}`).join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
