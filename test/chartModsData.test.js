import test from 'node:test'
import assert from 'node:assert/strict'
import { BORDER_CHART_MODS, FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'

test('碎片词缀目录覆盖 poedb 全部 150 条', () => {
  assert.equal(FRAGMENT_CHART_MODS.length, 150)
})

test('边框词缀目录覆盖 poedb 全部 65 条', () => {
  assert.equal(BORDER_CHART_MODS.length, 65)
})

test('碎片词缀条目字段完整且描述行非空', () => {
  for (const mod of FRAGMENT_CHART_MODS) {
    assert.ok(Number.isFinite(mod.tier), 'tier 必须是数字')
    assert.ok(['prefix', 'suffix', 'legendary'].includes(mod.affixType), `前后缀类型非法: ${mod.affixType}`)
    assert.ok(Array.isArray(mod.lines) && mod.lines.length > 0, '描述行不能为空')
    assert.ok(mod.lines.every(line => typeof line === 'string' && line.trim()), '描述行必须为非空字符串')
    assert.ok(Array.isArray(mod.tags), 'tags 必须是数组')
  }
})

test('边框词缀条目字段完整,仅 poedb 原文的空描述条目无描述行', () => {
  const emptyOnes = BORDER_CHART_MODS.filter(mod => mod.lines.length === 0)
  // poedb 原文第 60 条边框词缀描述为空,如实转录;其余条目必须非空。
  assert.equal(emptyOnes.length, 1)
  for (const mod of BORDER_CHART_MODS) {
    assert.ok(Number.isFinite(mod.tier), 'tier 必须是数字')
    assert.ok(mod.lines.every(line => typeof line === 'string' && line.trim()), '描述行必须为非空字符串')
    assert.ok(Array.isArray(mod.tags), 'tags 必须是数组')
  }
})

test('目录描述行不包含英文内部标签行', () => {
  const all = [...FRAGMENT_CHART_MODS, ...BORDER_CHART_MODS]
  for (const mod of all) {
    for (const line of mod.lines) {
      assert.ok(!/^[a-z][a-z ]+\[?\d*\]?$/i.test(line.trim()) || /[\u4e00-\u9fff]/.test(line), `英文标签行未被剔除: ${line}`)
    }
  }
})

test('未测绘词缀条目存在且描述正确', () => {
  const unveiled = FRAGMENT_CHART_MODS.filter(mod => mod.lines.includes('航行词缀将在完成测绘后揭示'))
  assert.equal(unveiled.length, 1)
  assert.equal(unveiled[0].tier, 1)
  assert.equal(unveiled[0].affixType, 'legendary')
})
