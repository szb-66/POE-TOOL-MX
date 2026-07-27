import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'

export const SKILL_CATALOG_SCHEMA_VERSION = 1
export const SKILL_GEM_COLORS = ['red', 'green', 'blue']
export const SKILL_GEM_KINDS = ['active', 'support']

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function stableSkillId(kind, sourcePath) {
  return `gem:${createHash('sha1').update(`${kind}:${sourcePath}`).digest('hex').slice(0, 16)}`
}

function colorFromLink(link) {
  return SKILL_GEM_COLORS.find((color) => link.hasClass(`gem_${color}`)) || null
}

export function parseSkillGemPage(html, { kind }) {
  if (!SKILL_GEM_KINDS.includes(kind)) throw new Error(`未知宝石类型：${kind}`)
  const $ = cheerio.load(String(html || ''))
  const records = []

  $('table.filters tbody tr').each((_index, row) => {
    const cells = $(row).find('td')
    const nameCell = cells.last()
    const link = nameCell.find('a[href]').filter((_linkIndex, item) => colorFromLink($(item)) != null).first()
    const color = colorFromLink(link)
    const name = cleanText(link.text())
    const sourcePath = String(link.attr('href') || '').trim()
    const cellCopy = nameCell.clone()
    cellCopy.find('.gem_tags, img').remove()
    const levelMatch = cleanText(cellCopy.text()).match(/\((\d+)\)/)
    const requiredLevel = Number(levelMatch?.[1])

    if (!name || !color || !/^\/cn\/[^/?#]+$/.test(sourcePath)) return
    if (!Number.isInteger(requiredLevel) || requiredLevel < 1 || requiredLevel > 100) return
    records.push({
      id: stableSkillId(kind, sourcePath),
      name,
      requiredLevel,
      color,
      kind,
      sourcePath
    })
  })

  const unique = new Map()
  for (const record of records) {
    const key = `${record.kind}\u0000${record.sourcePath}\u0000${record.name}\u0000${record.requiredLevel}\u0000${record.color}`
    if (!unique.has(key)) unique.set(key, record)
  }
  return [...unique.values()].sort((left, right) =>
    left.requiredLevel - right.requiredLevel
    || left.name.localeCompare(right.name, 'zh-CN')
    || left.kind.localeCompare(right.kind)
    || left.sourcePath.localeCompare(right.sourcePath)
  )
}

export function buildSkillGemCatalog({
  activeHtml,
  supportHtml,
  patch,
  generatedAt,
  sources = []
}) {
  const skills = [
    ...parseSkillGemPage(activeHtml, { kind: 'active' }),
    ...parseSkillGemPage(supportHtml, { kind: 'support' })
  ]
  const unique = new Map()
  for (const skill of skills) {
    const existing = unique.get(skill.id)
    if (existing && JSON.stringify(existing) !== JSON.stringify(skill)) {
      throw new Error(`技能稳定 ID 冲突：${skill.id}`)
    }
    unique.set(skill.id, skill)
  }
  return {
    schemaVersion: SKILL_CATALOG_SCHEMA_VERSION,
    patch,
    locale: 'zh-CN',
    generatedAt,
    sources,
    skills: [...unique.values()].sort((left, right) =>
      left.name.localeCompare(right.name, 'zh-CN')
      || left.requiredLevel - right.requiredLevel
      || left.kind.localeCompare(right.kind)
    )
  }
}
