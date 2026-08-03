import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SEASON_BASELINE, S30_SKILL_SENTINELS, S30_UNIQUE_SENTINELS } from '../shared/seasonBaseline.js'
import { CURRENT_RULESET } from '../electron/modules/crafting/seasonalRules.js'
import { VENDOR_DATA_META } from '../src/domains/shop/vendorData.js'

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

test('当前运行数据统一使用 S30 / POE1 3.29 基线', async () => {
  const [crafting, skills, uniques, trade] = await Promise.all([
    readJson('electron/assets/crafting-data/dataset.json'),
    readJson('src/domains/story/skillCatalog.json'),
    readJson('electron/assets/unique-items/catalog.json'),
    readJson('electron/modules/priceCheck/catalog.json')
  ])
  assert.deepEqual(CURRENT_RULESET, SEASON_BASELINE)
  assert.equal(crafting.manifest.patch, SEASON_BASELINE.patch)
  assert.equal(crafting.manifest.league, SEASON_BASELINE.league)
  assert.equal(skills.patch, SEASON_BASELINE.patch)
  assert.equal(uniques.patch, SEASON_BASELINE.patch)
  assert.equal(trade.gameVersion, SEASON_BASELINE.patch)
  assert.match(VENDOR_DATA_META.gameVersion, /S30.*3\.29/)
})

test('S30 技能与传奇关键记录已进入离线目录', async () => {
  const [skills, uniques] = await Promise.all([
    readJson('src/domains/story/skillCatalog.json'),
    readJson('electron/assets/unique-items/catalog.json')
  ])
  assert.deepEqual(S30_SKILL_SENTINELS.filter((sourcePath) => !skills.skills.some((entry) => entry.sourcePath === sourcePath)), [])
  assert.ok(S30_UNIQUE_SENTINELS.some((name) => uniques.items.some((entry) => entry.name === name)))
})

test('3.28 原始快照保留且 3.29 使用独立目录', async () => {
  for (const kind of ['crafting-raw', 'skill-raw', 'unique-items-raw']) {
    const oldManifest = await readJson(`electron/assets/${kind}/3.28/manifest.json`)
    const currentManifest = await readJson(`electron/assets/${kind}/3.29/manifest.json`)
    assert.equal(oldManifest.patch, '3.28')
    assert.equal(currentManifest.patch, SEASON_BASELINE.patch)
  }
})
