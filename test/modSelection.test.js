import test from 'node:test'
import assert from 'node:assert/strict'
import {
  familySelectionState,
  tierSelectionKey,
  toggleFamilySelection,
  toggleTierSelection
} from '../src/domains/crafting/modSelection.js'

const tier = (id, modifierId, available = true) => ({ id, modifierId, available })

test('稳定选择键隔离不同 modifier 下的同名阶级 ID', () => {
  assert.notEqual(tierSelectionKey(tier('tier:1', 'modifier:a')), tierSelectionKey(tier('tier:1', 'modifier:b')))
  assert.throws(() => tierSelectionKey({ id: 'tier:1' }), /缺少稳定标识/)
})

test('单项切换不会选择不可用阶级', () => {
  const available = tier('tier:1', 'modifier:a')
  const unavailable = tier('tier:2', 'modifier:a', false)
  const selected = toggleTierSelection(new Set(), available, true)
  assert.equal(selected.has(tierSelectionKey(available)), true)
  assert.equal(toggleTierSelection(selected, unavailable, true).has(tierSelectionKey(unavailable)), false)
  assert.equal(toggleTierSelection(selected, available, false).size, 0)
})

test('Family 批量切换只处理合法阶级并报告全选和半选', () => {
  const first = tier('tier:1', 'modifier:a')
  const second = tier('tier:2', 'modifier:a')
  const unavailable = tier('tier:3', 'modifier:a', false)
  const family = { tiers: [first, second, unavailable] }
  const partial = toggleTierSelection(new Set(), first, true)
  assert.deepEqual(familySelectionState(partial, family), { checked: false, indeterminate: true, selectedCount: 1, selectableCount: 2 })
  const all = toggleFamilySelection(partial, family, true)
  assert.deepEqual(familySelectionState(all, family), { checked: true, indeterminate: false, selectedCount: 2, selectableCount: 2 })
  assert.equal(all.has(tierSelectionKey(unavailable)), false)
  assert.equal(toggleFamilySelection(all, family, false).size, 0)
})
