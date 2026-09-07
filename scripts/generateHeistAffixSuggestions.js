// 从 POEDB 的普通契约/蓝图词缀生成离线联想目录。
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { load } from 'cheerio'
import { buildChartAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'

export const SOURCE_URLS = ['https://poedb.tw/cn/Contracts', 'https://poedb.tw/cn/Blueprints']

export function parseHeistAffixes(html) {
  const raw = html.match(/new ModsView\((\{[^\n]+\})\)/)?.[1]
  if (!raw) throw new Error('POEDB 页面缺少 ModsView 数据')
  const data = JSON.parse(raw)
  if (data.opt?.ModDomainsID !== 22 || !Array.isArray(data.normal)) {
    throw new Error('POEDB 页面不是契约蓝图词缀目录')
  }
  return data.normal.filter(mod => Number(mod.DropChance) > 0 && ['1', '2'].includes(String(mod.ModGenerationTypeID))).map(mod => {
    const $ = load(mod.str)
    $('.secondary').remove()
    $('br').replaceWith('\n')
    return {
      affixType: String(mod.ModGenerationTypeID) === '1' ? 'prefix' : 'suffix',
      lines: $.root().text().split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean),
      tags: (mod.mod_no || []).map(tag => load(tag).root().text().trim()).filter(Boolean)
    }
  })
}

async function main() {
  const sources = await Promise.all(SOURCE_URLS.map(async url => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    const mods = parseHeistAffixes(await response.text())
    if (!mods.length) throw new Error(`${url}: 可洗词缀为空`)
    return { url, mods }
  }))
  // 复用连续非数值片段提取和档位合并，绝不拼接数字两侧文本。
  const entries = buildChartAffixSuggestions(sources.flatMap(source => source.mods))
  if (!entries.length || entries.some(entry => !entry.variants.every(line => line.includes(entry.value)))) {
    throw new Error('联想目录不满足稳定子串约束')
  }
  const meta = {
    game: 'poe1', locale: 'zh-CN', snapshotDate: new Date().toISOString().slice(0, 10),
    source: 'POEDB 简体中文契约蓝图普通词缀快照', sourceUrls: SOURCE_URLS,
    sourceCounts: sources.map(source => ({ url: source.url, mods: source.mods.length }))
  }
  const output = `// 由 scripts/generateHeistAffixSuggestions.js 生成。请运行该脚本更新快照。\nexport const HEIST_AFFIX_CATALOG_META = Object.freeze(${JSON.stringify(meta, null, 2)})\n\nexport const HEIST_AFFIX_SUGGESTIONS = Object.freeze(${JSON.stringify(entries, null, 2)}.map(entry => Object.freeze({\n  ...entry, tags: Object.freeze(entry.tags), variants: Object.freeze(entry.variants)\n})))\n`
  await writeFile(new URL('../src/data/heistAffixSuggestionsData.js', import.meta.url), output)
  console.log(`已生成 ${entries.length} 条契约蓝图联想，来源条数：${sources.map(source => source.mods.length).join(' / ')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
