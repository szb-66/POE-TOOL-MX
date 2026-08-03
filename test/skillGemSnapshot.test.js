import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const catalog = JSON.parse(await readFile(new URL('../src/domains/story/skillCatalog.json', import.meta.url), 'utf8'))

test('真实技能目录包含完整元数据、主动与辅助宝石哨兵', () => {
  assert.equal(catalog.schemaVersion, 1)
  assert.equal(catalog.patch, '3.29')
  assert.equal(catalog.locale, 'zh-CN')
  assert.ok(catalog.generatedAt)
  assert.equal(catalog.sources.length, 2)
  assert.ok(catalog.skills.length > 700)
  assert.ok(catalog.skills.every(skill =>
    skill.id && skill.name && Number.isInteger(skill.requiredLevel)
    && ['red', 'green', 'blue', 'white'].includes(skill.color)
    && ['active', 'support'].includes(skill.kind)
    && skill.sourcePath.startsWith('/cn/')
  ))
  assert.deepEqual(
    (({ name, requiredLevel, color, kind }) => ({ name, requiredLevel, color, kind }))(
      catalog.skills.find(skill => skill.name === '劈砍' && skill.kind === 'active')
    ),
    { name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active' }
  )
  assert.deepEqual(
    (({ name, requiredLevel, color, kind }) => ({ name, requiredLevel, color, kind }))(
      catalog.skills.find(skill => skill.name === '号召' && skill.kind === 'active')
    ),
    { name: '号召', requiredLevel: 24, color: 'white', kind: 'active' }
  )
  assert.ok(catalog.skills.some(skill => skill.name === '无情(辅)' && skill.kind === 'support'))
})
