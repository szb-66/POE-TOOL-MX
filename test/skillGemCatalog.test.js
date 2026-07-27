import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSkillGemCatalog, parseSkillGemPage } from '../scripts/skillGemCatalog.js'
import {
  applySkillCatalogSelection,
  searchSkillCatalog,
  skillSuggestionLabel,
  updateSkillFreeText
} from '../src/domains/story/skillCatalog.js'

const page = (rows) => `
  <table class="filters"><tbody>${rows}</tbody></table>
`
const row = ({ color, path, name, level }) => `
  <tr><td><a class="gem_${color}" href="${path}"><img></a></td>
  <td><a class="gem_${color}" href="${path}">${name}</a> (${level})<div class="gem_tags">标签</div></td></tr>
`

test('技能页面解析名称、等级、颜色、类型并忽略无效行和重复项', () => {
  const cleave = row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })
  const parsed = parseSkillGemPage(page(`
    ${cleave}${cleave}
    ${row({ color: 'green', path: '/cn/Blade_Trap', name: 'Blade Trap', level: 12 })}
    <tr><td>无效记录</td></tr>
  `), { kind: 'active' })
  assert.equal(parsed.length, 2)
  assert.deepEqual(parsed.map(({ name, requiredLevel, color, kind, sourcePath }) => ({
    name, requiredLevel, color, kind, sourcePath
  })), [
    { name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active', sourcePath: '/cn/Cleave' },
    { name: 'Blade Trap', requiredLevel: 12, color: 'green', kind: 'active', sourcePath: '/cn/Blade_Trap' }
  ])
  assert.ok(parsed.every(skill => skill.id.startsWith('gem:')))
})

test('规范化目录合并主动与辅助宝石并保留元数据', () => {
  const catalog = buildSkillGemCatalog({
    activeHtml: page(row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })),
    supportHtml: page(row({ color: 'blue', path: '/cn/Arcane_Surge_Support', name: '秘术增强(辅)', level: 1 })),
    patch: '3.28',
    generatedAt: '2026-07-27T00:00:00.000Z',
    sources: [{ id: 'gem:active' }]
  })
  assert.equal(catalog.schemaVersion, 1)
  assert.equal(catalog.locale, 'zh-CN')
  assert.deepEqual(new Set(catalog.skills.map(skill => skill.kind)), new Set(['active', 'support']))
})

test('联想支持中文和不区分大小写的英文子串并始终生成等级标签', () => {
  const skills = [
    { id: 'a', name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active' },
    { id: 'b', name: 'Blade Trap', requiredLevel: 12, color: 'green', kind: 'active' }
  ]
  assert.equal(searchSkillCatalog(skills, '劈')[0].value, '劈砍(1)')
  assert.equal(searchSkillCatalog(skills, 'TRAP')[0].name, 'Blade Trap')
  assert.equal(skillSuggestionLabel(skills[1]), 'Blade Trap(12)')
})

test('选择目录技能补齐信息，自由编辑解除目录关联但保留颜色', () => {
  const skill = { id: 'story-skill', name: '劈', color: 'blue' }
  applySkillCatalogSelection(skill, {
    id: 'gem:cleave', name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active'
  })
  assert.deepEqual(skill, {
    id: 'story-skill',
    name: '劈砍',
    color: 'red',
    gemId: 'gem:cleave',
    requiredLevel: 1,
    kind: 'active'
  })
  updateSkillFreeText(skill, '自定义劈砍')
  assert.deepEqual(skill, { id: 'story-skill', name: '自定义劈砍', color: 'red' })
})
