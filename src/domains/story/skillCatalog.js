import cnSkillCatalog from './skillCatalog.json' with { type: 'json' }
import internationalSkillCatalog from './skillCatalog.international.json' with { type: 'json' }

export const SKILL_KIND_LABELS = Object.freeze({
  active: '主动',
  support: '辅助'
})

export const SKILL_COLOR_LABELS = Object.freeze({
  red: '红色',
  green: '绿色',
  blue: '蓝色',
  white: '白色'
})

export function gemSlugFromSourcePath(sourcePath) {
  return String(sourcePath || '').trim().replace(/^\/(?:cn|us)\//, '')
}

const cnGemBySlug = new Map()
const enGemBySlug = new Map()
const slugByGemId = new Map()
const slugByGemName = new Map()

for (const skill of cnSkillCatalog.skills || []) {
  const slug = gemSlugFromSourcePath(skill.sourcePath)
  if (!slug) continue
  cnGemBySlug.set(slug, skill)
  if (skill.id) slugByGemId.set(skill.id, slug)
  if (skill.name) slugByGemName.set(skill.name, slug)
}
for (const skill of internationalSkillCatalog.skills || []) {
  const slug = gemSlugFromSourcePath(skill.sourcePath)
  if (!slug) continue
  enGemBySlug.set(slug, skill)
  if (skill.id) slugByGemId.set(skill.id, slug)
  if (skill.name) slugByGemName.set(skill.name, slug)
}

export function resolveSkillSlug(skill) {
  if (!skill || typeof skill !== 'object') return ''
  if (typeof skill.gemSlug === 'string' && skill.gemSlug && (cnGemBySlug.has(skill.gemSlug) || enGemBySlug.has(skill.gemSlug))) {
    return skill.gemSlug
  }
  if (skill.gemId && slugByGemId.has(skill.gemId)) {
    return slugByGemId.get(skill.gemId)
  }
  if (skill.gemId && skill.name && slugByGemName.has(skill.name)) {
    return slugByGemName.get(skill.name)
  }
  return ''
}

export function resolveSkillForServer(skill, serverId = 'cn', aliases = null) {
  if (!skill || typeof skill !== 'object') return skill
  const slug = resolveSkillSlug(skill)
  if (!slug) return { ...skill, displayName: skill.name || '' }
  const targetGem = serverId === 'international' ? enGemBySlug.get(slug) : cnGemBySlug.get(slug)
  if (!targetGem) return { ...skill, gemSlug: slug, displayName: skill.name || '' }
  const displayName = aliases?.get?.(targetGem.name)?.displayText || targetGem.name
  return {
    ...skill,
    gemSlug: slug,
    gemId: targetGem.id,
    name: targetGem.name,
    displayName,
    color: targetGem.color || skill.color,
    requiredLevel: targetGem.requiredLevel ?? skill.requiredLevel,
    kind: targetGem.kind || skill.kind
  }
}

export function skillSuggestionLabel(skill) {
  return `${skill.displayName || skill.name}(${skill.requiredLevel})`
}

export function searchSkillCatalog(skills, query, limit = 30, aliases = new Map()) {
  const needle = String(query || '').trim().toLocaleLowerCase('zh-CN')
  if (!needle) return []
  return (Array.isArray(skills) ? skills : [])
    .filter(skill => [skill?.name, ...(aliases.get(skill?.name)?.aliases || [])].some(name => String(name || '').toLocaleLowerCase('zh-CN').includes(needle)))
    .sort((left, right) => {
      const leftName = left.name.toLocaleLowerCase('zh-CN')
      const rightName = right.name.toLocaleLowerCase('zh-CN')
      return Number(!leftName.startsWith(needle)) - Number(!rightName.startsWith(needle))
        || left.requiredLevel - right.requiredLevel
        || left.name.localeCompare(right.name, 'zh-CN')
    })
    .slice(0, Math.max(1, Number(limit) || 30))
    .map(skill => {
      const displayName = aliases.get(skill.name)?.displayText || skill.name
      return { ...skill, displayName, value: skillSuggestionLabel({ ...skill, displayName: displayName === skill.name ? displayName : `${displayName} / ${skill.name}` }) }
    })
}

export function applySkillCatalogSelection(skill, selected) {
  if (!skill || !selected) return skill
  const gemSlug = gemSlugFromSourcePath(selected.sourcePath)
  Object.assign(skill, {
    name: selected.name,
    color: selected.color,
    gemId: selected.id,
    ...(gemSlug ? { gemSlug } : {}),
    requiredLevel: selected.requiredLevel,
    kind: selected.kind
  })
  return skill
}

export function updateSkillFreeText(skill, value) {
  if (!skill) return skill
  skill.name = String(value ?? '')
  if (skill.gemId || skill.gemSlug) {
    delete skill.gemId
    delete skill.gemSlug
    delete skill.requiredLevel
    delete skill.kind
  }
  return skill
}
