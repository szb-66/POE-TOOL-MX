import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'
import { usePresetStore } from '../src/stores/preset.js'
import { validateSpecializedCraftingConfig } from '../src/utils/validation.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  }
}

const effectiveGroup = keyword => ({
  id: `group-${keyword}`,
  name: keyword,
  enabled: true,
  requiredAffixes: [keyword],
  selectedAffixes: [],
  selectedCount: 1
})

test('三类制作预设、当前选择和首次识别设置彼此隔离并持久化', () => {
  globalThis.localStorage = memoryStorage({ itemCraftingKind: 'invalid-kind' })
  setActivePinia(createPinia())
  const store = usePresetStore()
  assert.equal(store.itemCraftingKind, 'general')
  assert.deepEqual(store.craftingInitialChecks, { general: true, essence: true, harvest: true })

  const essence = store.addEssencePreset('生命精华')
  const harvest = store.addHarvestPreset('生命花园')
  store.updateCurrentEssencePreset({ essencePosition: { x: 101, y: 202 }, affixGroups: [effectiveGroup('最大生命')] })
  store.updateCurrentHarvestPreset({ essencePosition: { x: 999, y: 999 }, affixGroups: [effectiveGroup('火焰抗性')] })
  store.updateCraftingInitialCheck('essence', false)
  store.setItemCraftingKind('harvest')

  assert.equal(store.currentEssencePreset.id, essence.id)
  assert.deepEqual(store.currentEssencePreset.essencePosition, { x: 101, y: 202 })
  assert.equal(store.currentHarvestPreset.id, harvest.id)
  assert.equal(Object.hasOwn(store.currentHarvestPreset, 'essencePosition'), false)
  assert.equal(store.currentItemPreset.name, '默认预设')

  const secondEssence = store.addEssencePreset('第二精华')
  assert.notEqual(secondEssence.id, essence.id)
  assert.equal(store.switchEssencePreset(essence.id), true)
  store.updateCurrentEssencePreset({ name: '生命精华（改）' })
  assert.equal(store.currentEssencePreset.name, '生命精华（改）')
  assert.equal(store.deleteEssencePreset(secondEssence.id), true)
  assert.equal(store.essencePresets.some(preset => preset.id === secondEssence.id), false)

  setActivePinia(createPinia())
  const restored = usePresetStore()
  assert.equal(restored.itemCraftingKind, 'harvest')
  assert.equal(restored.craftingInitialChecks.essence, false)
  assert.equal(restored.craftingInitialChecks.general, true)
  assert.equal(restored.currentEssencePreset.name, '生命精华（改）')
  assert.deepEqual(restored.currentEssencePreset.essencePosition, { x: 101, y: 202 })
  assert.equal(restored.currentHarvestPreset.affixGroups[0].requiredAffixes[0].keyword, '火焰抗性')
})

test('专用制作校验同时拦截坐标缺失与空词缀目标', () => {
  const invalid = validateSpecializedCraftingConfig({
    kind: 'essence',
    itemPosition: { x: 0, y: 0 },
    actionPosition: { x: 0, y: 0 },
    preset: { affixGroups: [{ enabled: true, requiredAffixes: [], selectedAffixes: [] }] }
  })
  assert.equal(invalid.isValid, false)
  assert.match(invalid.errors.join('\n'), /物品位置/)
  assert.match(invalid.errors.join('\n'), /目标使用精华的位置/)
  assert.match(invalid.errors.join('\n'), /有效的达标组合/)

  const valid = validateSpecializedCraftingConfig({
    kind: 'harvest',
    itemPosition: { x: 100, y: 200 },
    actionPosition: { x: 300, y: 400 },
    preset: { affixGroups: [effectiveGroup('最大生命')] }
  })
  assert.equal(valid.isValid, true)
})

test('三页被制作物品坐标及花园按钮坐标使用独立设备设置', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { useSettingsStore } = await server.ssrLoadModule('/src/domains/settings/settingsStore.js')
    globalThis.localStorage = memoryStorage()
    setActivePinia(createPinia())
    const settings = useSettingsStore()
    settings.updateItemPosition({ x: 10, y: 20 })
    settings.updateEssenceItemPosition({ x: 30, y: 40 })
    settings.updateHarvestItemPosition({ x: 50, y: 60 })
    settings.updateHarvestCraftButtonPosition({ x: 70, y: 80 })

    setActivePinia(createPinia())
    const restored = useSettingsStore()
    assert.deepEqual(restored.itemPosition, { x: 10, y: 20 })
    assert.deepEqual(restored.essenceItemPosition, { x: 30, y: 40 })
    assert.deepEqual(restored.harvestItemPosition, { x: 50, y: 60 })
    assert.deepEqual(restored.harvestCraftButtonPosition, { x: 70, y: 80 })
  } finally {
    await server.close()
  }
})

test('制作页公开三个可记忆 Tab，精华坐标随预设而花园按钮坐标属于页面设置', async () => {
  const [view, panel, generalPanel, dashboard, restart] = await Promise.all([
    readFile('src/domains/items/ItemsView.vue', 'utf8'),
    readFile('src/domains/items/components/SpecializedCraftingPanel.vue', 'utf8'),
    readFile('src/domains/items/components/ModuleOne.vue', 'utf8'),
    readFile('src/domains/dashboard/useDashboard.js', 'utf8'),
    readFile('src/utils/craftingRestart.js', 'utf8')
  ])
  for (const label of ['通用', '精华', '花园工艺']) assert.match(view, new RegExp(`label="${label}"`))
  assert.match(view, /itemCraftingKind/)
  assert.match(panel, /currentEssencePreset/)
  assert.match(panel, /essencePosition/)
  assert.match(panel, /harvestCraftButtonPosition/)
  assert.match(panel, /<div v-if="kind === 'essence'" class="preset-coordinate-row">\s*<div class="form-item coordinate-item compact-coordinate">\s*<label class="form-label">目标使用精华位置/)
  assert.match(panel, /\.compact-coordinate \{ flex-direction: row; align-items: center;/)
  assert.match(panel, /<div v-if="kind === 'harvest'" class="form-item coordinate-item">[\s\S]*工艺按钮位置/)
  assert.match(panel, /craftingInitialChecks\[props\.kind\]/)
  assert.ok(panel.indexOf('>操作<') < panel.indexOf('>启动快捷键<'))
  assert.ok(generalPanel.indexOf('>操作<') < generalPanel.indexOf('>启动快捷键<'))
  assert.match(dashboard, /itemCraftingKind/)
  assert.match(restart, /craftingKind: craftingKind \|\| presetStore\.itemCraftingKind/)
})

test('精华与花园脚本动作顺序、安全停止、首次识别和 1000 次上限正确', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    ssr: { noExternal: ['element-plus'] }
  })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    await Promise.all([
      server.transformRequest('/src/domains/items/ItemsView.vue', { ssr: true }),
      server.transformRequest('/src/domains/items/components/SpecializedCraftingPanel.vue', { ssr: true }),
      server.transformRequest('/src/domains/items/components/AffixGoalEditor.vue', { ssr: true })
    ])
    const generate = (craftingKind, checkInitialItem = true) => generatePythonScript({
      globalShortcuts: { end: 'F12' },
      currencyPositions: {},
      operationDelayMs: 100,
      itemPosition: { x: 100, y: 200 },
      actionPosition: { x: 300, y: 400 },
      craftingKind,
      preset: {
        checkInitialItem,
        moduleTwo: { enabled: true, affixGroups: [effectiveGroup('最大生命')] },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: {}
    })
    const essence = generate('essence')
    const harvest = generate('harvest')

    const essencePreflight = essence.indexOf('if not preflight_specialized_action():')
    const essenceInitialMatch = essence.indexOf('and result.get("affixMatch", False):', essencePreflight)
    const essenceRight = essence.indexOf('click_mouse("right")', essenceInitialMatch)
    const essenceLeft = essence.indexOf('click_mouse("left")', essenceRight)
    const essenceRead = essence.indexOf('read_current_item(verify_freshness=True)', essenceLeft)
    assert.ok(essencePreflight >= 0 && essenceInitialMatch > essencePreflight)
    assert.ok(essenceRight > essenceInitialMatch && essenceLeft > essenceRight && essenceRead > essenceLeft)
    assert.match(essence, /目标位置不是精华/)
    assert.match(essence, /精华堆叠数量/)

    const harvestInitialMatch = harvest.indexOf('and result.get("affixMatch", False):')
    const harvestClick = harvest.indexOf('click_mouse("left")', harvestInitialMatch)
    const harvestMoveItem = harvest.indexOf('move_mouse\(int\(item_position\["x"\]\)', harvestClick)
    const harvestRead = harvest.indexOf('read_current_item(verify_freshness=True)', harvestMoveItem)
    assert.ok(harvestClick > harvestInitialMatch && harvestMoveItem > harvestClick && harvestRead > harvestMoveItem)
    assert.match(harvest, /工艺可用性/)

    for (const script of [essence, harvest]) {
      assert.match(script, /if read_result\.get\("unchanged"\):/)
      assert.match(script, /SPECIALIZED_ITEM_UNCHANGED/)
      assert.match(script, /for iteration in range\(1, 1001\):/)
      assert.match(script, /if not is_running:/)
      assert.match(script, /"event": "crafting-runtime-stopped", "mode": "items",\s*"craftingKind": globals\(\)\.get\("crafting_kind", "general"\)/)
      assert.match(script, /"event": "crafting-startup-failed", "mode": "items",\s*"craftingKind": globals\(\)\.get\("crafting_kind", "general"\)/)
      const compiled = spawnSync('python', ['-c', 'import sys; compile(sys.stdin.read(), "generated.py", "exec")'], {
        input: script,
        encoding: 'utf8',
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
      })
      assert.equal(compiled.status, 0, compiled.stderr)
    }
    assert.match(generate('harvest', false), /if False and result\.get\("affixMatch", False\):/)
  } finally {
    await server.close()
  }
})
