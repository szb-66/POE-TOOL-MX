import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('做装页面拥有独立路由、侧栏入口与主要状态交互', async () => {
  const [router, sidebar, view] = await Promise.all([
    readFile('src/router/index.js', 'utf8'),
    readFile('src/components/Layout/Sidebar.vue', 'utf8'),
    readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  ])
  assert.match(router, /path: '\/craft-planner'/)
  assert.match(sidebar, /index="\/craft-planner"/)
  for (const label of ['更新 POEDB 数据', '价格与覆盖', '选择底材', '添加目标词缀', '推荐路径', '取消计算', '缺少有效价格']) {
    assert.match(view, new RegExp(label))
  }
  assert.match(view, /el-cascader/)
  assert.match(view, /resource\.resourceId/)
  assert.doesNotMatch(view, /<img :src="selectedBase\.imageUrl"/)
  assert.match(view, /class="modifier-workspace"/)
  assert.ok(view.indexOf('已选词缀') < view.indexOf('待选词缀'))
  assert.match(view, /target\.minTierId/)
  assert.match(view, /权重/)
  assert.match(view, /family\.subitemCount/)
  assert.match(view, /family\.totalWeight/)
  assert.match(view, /family\.displayTags/)
  assert.match(view, /priceDisplayText\(record\)/)
  assert.match(view, /record\.warning/)
  assert.match(view, /Math\.abs\(numeric\) < 0\.01 \? 8/)
  assert.match(view, /class="family-name"/)
  assert.match(view, /class="family-tags"/)
  assert.doesNotMatch(view, /class="family-details"/)
  assert.ok(view.indexOf('class="family-name"') < view.indexOf('class="family-tags"'))
  assert.ok(view.indexOf('class="family-tags"') < view.indexOf('class="family-metrics"'))
  assert.match(view, /tier\.available/)
  assert.match(view, /tier\.displayTags/)
  assert.match(view, /addTarget\(modifier, tier\)/)
  assert.match(view, /minTierId: tier\.id/)
  assert.doesNotMatch(view, /entry-heading|modifier-entry|firstAvailableTier/)
  assert.ok(view.indexOf('1. 选择底材') < view.indexOf('2. 添加目标词缀'))
  assert.ok(view.indexOf('2. 添加目标词缀') < view.indexOf('3. 推荐路径'))
  assert.match(view, /displayTags/)
  assert.doesNotMatch(view, /modifierSource|sourcePolicy|仅工艺台|任一来源/)
})

test('preload 仅暴露具名做装接口并提供事件退订', async () => {
  const preload = await readFile('electron/preload.cjs', 'utf8')
  const api = await readFile('src/api/electron.js', 'utf8')
  for (const name of ['getCraftingStatus', 'searchCraftingBases', 'searchCraftingModifiers', 'updateCraftingData', 'startCraftingPlan', 'cancelCraftingPlan']) {
    assert.match(preload, new RegExp(name))
  }
  assert.match(preload, /removeListener\('crafting-plan-event'/)
  assert.match(api, /crafting:\s*\{/)
  assert.match(api, /仅 Electron 客户端支持做装计算/)
})

test('帮助页声明数据来源、限制、OCR 风险和非商业用途', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['POEDB', 'poecurrency.top', 'OCR', '底材成本不计入', '个人、非商业']) assert.match(help, new RegExp(text))
})
