export const SKILL_KIND_LABELS = Object.freeze({
  active: '主动',
  support: '辅助'
})

export const SKILL_COLOR_LABELS = Object.freeze({
  red: '红色',
  green: '绿色',
  blue: '蓝色'
})

export function skillSuggestionLabel(skill) {
  return `${skill.name}(${skill.requiredLevel})`
}

export function searchSkillCatalog(skills, query, limit = 30) {
  const needle = String(query || '').trim().toLocaleLowerCase('zh-CN')
  if (!needle) return []
  return (Array.isArray(skills) ? skills : [])
    .filter(skill => String(skill?.name || '').toLocaleLowerCase('zh-CN').includes(needle))
    .sort((left, right) => {
      const leftName = left.name.toLocaleLowerCase('zh-CN')
      const rightName = right.name.toLocaleLowerCase('zh-CN')
      return Number(!leftName.startsWith(needle)) - Number(!rightName.startsWith(needle))
        || left.requiredLevel - right.requiredLevel
        || left.name.localeCompare(right.name, 'zh-CN')
    })
    .slice(0, Math.max(1, Number(limit) || 30))
    .map(skill => ({ ...skill, value: skillSuggestionLabel(skill) }))
}

export function applySkillCatalogSelection(skill, selected) {
  if (!skill || !selected) return skill
  Object.assign(skill, {
    name: selected.name,
    color: selected.color,
    gemId: selected.id,
    requiredLevel: selected.requiredLevel,
    kind: selected.kind
  })
  return skill
}

export function updateSkillFreeText(skill, value) {
  if (!skill) return skill
  skill.name = String(value ?? '')
  if (skill.gemId) {
    delete skill.gemId
    delete skill.requiredLevel
    delete skill.kind
  }
  return skill
}
