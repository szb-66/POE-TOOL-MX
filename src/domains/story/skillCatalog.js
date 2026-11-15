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
