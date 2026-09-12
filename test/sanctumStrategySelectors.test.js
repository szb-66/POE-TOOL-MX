import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { createSanctumStrategy, validateSanctumStrategy } from '../shared/sanctum.js'
import { layoutLabels } from '../shared/sanctumPresentation.js'
import { afflictionOptions, canAddStrategyWeight } from '../src/domains/sanctum/strategyOptions.js'

test('痛苦摘要只提供当前赛季官方审核条目及中文描述', () => {
  const entry = { id: 'affliction:a', name: '痛苦甲', kind: 'affliction', descriptions: ['描述'],
    applicability: 'current', reviewedPatch: SEASON_BASELINE.patch, sourceId: 'official' }
  const catalog = { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch,
    sources: [{ id: 'official', channel: 'official' }], entries: [entry,
      { ...entry, id: 'old', reviewedPatch: 'old' }, { ...entry, id: 'unknown', applicability: 'unverified' },
      { ...entry, id: 'community', sourceId: 'community' }, { ...entry, id: 'boon', kind: 'boon' }] }
  const service = new SanctumService({ catalog })
  assert.deepEqual(service.getState().catalogSummary.afflictions, [{ id: entry.id, label: entry.name, descriptions: ['描述'] }])
  service.catalog = { ...catalog, patch: 'old' }
  assert.deepEqual(service.getState().catalogSummary.afflictions, [])
})

test('奖励名称及六种玩法限制新增，并阻止重复和任意输入', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/currency/manifest.json', import.meta.url)))
  const rewards = manifest.entries.map(entry => ({ id: entry.name }))
  const layouts = Object.keys(layoutLabels).map(id => ({ id }))
  const strategy = createSanctumStrategy()
  assert.equal(layouts.length, 6)
  assert.equal(canAddStrategyWeight(strategy, 'layoutPreference', 'boss', layouts), true)
  assert.equal(canAddStrategyWeight(strategy, 'layoutPreference', 'exit', layouts), false)
  assert.equal(canAddStrategyWeight(strategy, 'targetPriority', '混沌石', rewards), true)
  assert.equal(canAddStrategyWeight(strategy, 'targetPriority', '神圣石', rewards), false)
  for (const key of ['', '未知货币', '__proto__']) assert.equal(canAddStrategyWeight(strategy, 'targetPriority', key, rewards), false)
})

test('历史名称和未知痛苦原值往返，移除后不会成为可新增选项', () => {
  const catalog = [{ id: 'affliction:a', label: '痛苦甲', descriptions: ['描述'] }]
  const strategy = createSanctumStrategy()
  strategy.toleratedAfflictions = ['痛苦甲', '历史未知']
  strategy.bannedAfflictions = ['affliction:a']
  const options = afflictionOptions(catalog, strategy.toleratedAfflictions)
  assert.equal(options.find(option => option.id === 'affliction:a').disabled, true)
  assert.equal(options.find(option => option.id === '痛苦甲').label, '痛苦甲')
  assert.deepEqual(validateSanctumStrategy(strategy).toleratedAfflictions, ['痛苦甲', '历史未知'])
  strategy.toleratedAfflictions = []
  assert.deepEqual(afflictionOptions(catalog, []), [{ ...catalog[0], disabled: false }])
  assert.deepEqual(afflictionOptions(undefined, ['历史未知']).map(option => option.id), ['历史未知'])
  const service = new SanctumService({})
  service.setEnabled(true)
  service.saveStrategy(strategy)
  assert.deepEqual(service.getState().strategy.toleratedAfflictions, [])
  assert.deepEqual(service.getState().strategy.bannedAfflictions, ['affliction:a'])
})
