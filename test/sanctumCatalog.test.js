import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSanctumCatalogText } from '../electron/modules/sanctum/catalog.js'
import { parseSanctumCatalogHtml } from '../scripts/sanctum/catalogParser.js'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'
import fs from 'node:fs'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'

function catalog() {
  return { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch, sources: [{ id: 'source', channel: 'official' }],
    entries: [{ id: 'effect', name: '测试痛苦', aliases: ['测试别名'], kind: 'affliction', sourceId: 'source',
      applicability: 'current', reviewedPatch: SEASON_BASELINE.patch, descriptions: ['不能恢复坚毅', '尚未支持的规则'] }] }
}
test('目录精确别名匹配，支持的限制与计算缺口分开', () => {
  const result = resolveSanctumCatalogText(catalog(), 'affliction', '测试别名')
  assert.equal(result.status, 'matched')
  assert.equal(result.effects[0].rule, 'cannotRecover')
  assert.equal(result.effects[1].status, 'unknown')
  assert.equal(result.scoringComplete, false)
  assert.equal(resolveSanctumCatalogText(catalog(), 'affliction', '测试别各').status, 'unknown')
})
test('歧义、历史、PTR、未核对及错误赛季均不参与当前规则', () => {
  const data = catalog()
  data.entries.push({ ...data.entries[0], id: 'another' })
  assert.equal(resolveSanctumCatalogText(data, 'affliction', '测试别名').reason, 'AMBIGUOUS')
  for (const applicability of ['historical', 'ptr', 'unverified']) {
    const data = catalog(); data.entries[0].applicability = applicability
    assert.equal(resolveSanctumCatalogText(data, 'affliction', '测试别名').status, 'unknown')
  }
  const ptr = catalog(); ptr.sources[0].channel = 'ptr'
  assert.equal(resolveSanctumCatalogText(ptr, 'affliction', '测试别名').status, 'unknown')
  const old = catalog(); old.patch = '3.20'
  assert.equal(resolveSanctumCatalogText(old, 'affliction', '测试别名').reason, 'CATALOG_VERSION_MISMATCH')
})
test('刷新只提取数据表且全部待核对，不混入社区历史章节', () => {
  const cards = ['恩赐', 'Affliction', 'Rooms'].map(id => `<section id="${id}"><div class="flex-grow-1">测试${id}<div class="explicitMod">效果</div></div></section>`).join('')
  const html = `${cards}<section id="Rewards"><table><tbody><tr><td>奖励</td></tr></tbody></table></section><div id="markContent"><div class="flex-grow-1">历史效果</div></div>`
  const result = parseSanctumCatalogHtml(html, { fetchedAt: '2026-09-09T00:00:00Z' })
  assert.equal(result.entries.length, 4)
  assert.ok(result.entries.every(entry => entry.applicability === 'unverified'))
  assert.equal(result.sources[0].sha256.length, 64)
  assert.throws(() => parseSanctumCatalogHtml('<html>维护中</html>', { fetchedAt: '2026-09-09T00:00:00Z' }), /结构不完整/)
})

test('同图标同内容跨层重复合并，不同层数变体保留独立标识及名称歧义', () => {
  const card = (name, description) => `<div><img alt="shared"><div class="flex-grow-1">${name}<div class="explicitMod">${description}</div></div></div>`
  const html = `<section id="Rooms">${card('喷泉', '包含喷泉').repeat(4)}</section>
    <section id="恩赐">${card('多层效果', '一层')}${card('多层效果', '两层')}</section>
    <section id="Affliction">${card('痛苦', '效果')}</section>
    <section id="Rewards"><table><tbody><tr><td>奖励</td></tr></tbody></table></section>`
  const result = parseSanctumCatalogHtml(html, { fetchedAt: '2026-09-09T00:00:00Z' })
  assert.equal(result.entries.filter(entry => entry.kind === 'room').length, 1)
  const variants = result.entries.filter(entry => entry.kind === 'boon')
  assert.equal(variants.length, 2)
  assert.notEqual(variants[0].id, variants[1].id)
  assert.equal(resolveSanctumCatalogText(result, 'boon', '多层效果').reason, 'AMBIGUOUS')
})

test('发布目录标识唯一，审核后的公共房间名称与包含描述都能确认类型', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url)))
  assert.equal(new Set(data.entries.map(entry => entry.id)).size, data.entries.length)
  assert.equal(resolveSanctumCatalogText(data, 'room', '喷泉').status, 'matched')
  for (const text of ['喷泉', '包含喷泉']) {
    const parsed = parseSanctumRoomTexts([text, '恢复 25 点坚毅'], data)
    assert.equal(parsed.type, 'fountain')
    assert.equal(parsed.recovery, 25)
  }
  const conflict = parseSanctumRoomTexts(['包含喷泉', '包含商人'], data)
  assert.equal(conflict.type, undefined)
  assert.equal(conflict.detailsStatus, 'partial')
  assert.equal(resolveSanctumCatalogText(data, 'room', '烛火礼拜堂').reason, 'AMBIGUOUS')
})
