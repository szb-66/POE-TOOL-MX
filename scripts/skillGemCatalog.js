import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'

export const SKILL_CATALOG_SCHEMA_VERSION = 1
export const SKILL_GEM_COLORS = ['red', 'green', 'blue', 'white']
export const SKILL_GEM_KINDS = ['active', 'support']

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function stableSkillId(kind, sourcePath) {
  return `gem:${createHash('sha1').update(`${kind}:${sourcePath}`).digest('hex').slice(0, 16)}`
}

function colorFromLink(link) {
  return SKILL_GEM_COLORS.slice(0, 3).find((color) => link.hasClass(`gem_${color}`)) || 'white'
}

export function parseSkillGemPage(html, { kind, locale = 'zh-CN' }) {
  if (!SKILL_GEM_KINDS.includes(kind)) throw new Error(`未知宝石类型：${kind}`)
  if (!['zh-CN', 'en'].includes(locale)) throw new Error(`未知技能目录语言：${locale}`)
  const prefix = locale === 'en' ? '/us/' : '/cn/'
  const $ = cheerio.load(String(html || ''))
  const records = []

  $('table.filters tbody tr').each((_index, row) => {
    const cells = $(row).find('td')
    const nameCell = cells.last()
    const link = nameCell.find('a[href]').filter((_linkIndex, item) => cleanText($(item).text())).first()
    const color = colorFromLink(link)
    const name = cleanText(link.text())
    const sourcePath = String(link.attr('href') || '').trim()
    const hasImage = $(row).find('img').length > 0
    const cellCopy = nameCell.clone()
    cellCopy.find('.gem_tags, img').remove()
    const levelMatch = cleanText(cellCopy.text()).match(/\((\d+)\)/)
    const requiredLevel = Number(levelMatch?.[1])

    if (!name || !hasImage || !sourcePath.startsWith(prefix) || !/^\/(?:cn|us)\/[^/?#]+$/.test(sourcePath)) return
    if (!Number.isInteger(requiredLevel) || requiredLevel < 1 || requiredLevel > 100) return
    records.push({
      id: stableSkillId(kind, sourcePath.replace(/^\/us\//, '/cn/')),
      name,
      requiredLevel,
      color,
      kind,
      sourcePath
    })
  })

  const unique = new Map()
  for (const record of records) {
    const existing = unique.get(record.id)
    if (!existing || record.requiredLevel < existing.requiredLevel) unique.set(record.id, record)
  }
  return [...unique.values()].sort((left, right) =>
    left.requiredLevel - right.requiredLevel
    || left.name.localeCompare(right.name, locale)
    || left.kind.localeCompare(right.kind)
    || left.sourcePath.localeCompare(right.sourcePath)
  )
}

export function buildSkillGemCatalog({
  activeHtml,
  supportHtml,
  patch,
  generatedAt,
  sources = [],
  locale = 'zh-CN'
}) {
  const skills = [
    ...parseSkillGemPage(activeHtml, { kind: 'active', locale }),
    ...parseSkillGemPage(supportHtml, { kind: 'support', locale })
  ]
  const unique = new Map()
  for (const skill of skills) {
    const existing = unique.get(skill.id)
    if (existing && (
      existing.name !== skill.name
      || existing.color !== skill.color
      || existing.kind !== skill.kind
      || existing.sourcePath !== skill.sourcePath
    )) {
      throw new Error(`技能稳定 ID 冲突：${skill.id}`)
    }
    if (!existing || skill.requiredLevel < existing.requiredLevel) unique.set(skill.id, skill)
  }
  return {
    schemaVersion: SKILL_CATALOG_SCHEMA_VERSION,
    patch,
    locale,
    generatedAt,
    sources,
    skills: [...unique.values()].sort((left, right) =>
      left.name.localeCompare(right.name, locale)
      || left.requiredLevel - right.requiredLevel
      || left.kind.localeCompare(right.kind)
    )
  }
}
