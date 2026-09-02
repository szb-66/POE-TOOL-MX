import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('物品制作详情页复用制作启动服务并阻止重复或并行启动', () => {
  const view = source('../src/domains/items/components/ModuleOne.vue')

  assert.match(view, /import \{ commitGlobalShortcut, startCrafting \} from ['"]\.\.\/\.\.\/\.\.\/utils\/scriptService['"]/)
  assert.match(view, /const starting = ref\(false\)/)
  assert.match(view, /const isCurrentModeRunning = computed\(\(\) => scriptStore\.isRunning && scriptStore\.mode === 'items'\)/)
  assert.match(view, /:loading="starting"/)
  assert.match(view, /:disabled="starting \|\| scriptStore\.isRunning"/)
  assert.match(view, /\{\{ isCurrentModeRunning \? '运行中' : '启动' \}\}/)
  assert.match(view, /async function handleStart\(\)[\s\S]*starting\.value = true[\s\S]*await startCrafting\(\{ craftingKind: 'general' \}\)[\s\S]*starting\.value = false/)
})

test('物品制作页顶部提供被制作物品坐标并复用持久化取点流程', () => {
  const view = source('../src/domains/items/components/ModuleOne.vue')
  const help = source('../src/domains/help/helpContent.js')

  assert.match(view, /<label class="form-label">被制作物品位置<\/label>/)
  assert.doesNotMatch(view, /此坐标是游戏中被制作物品所在的位置|class="position-help"/)
  assert.match(view, /<CoordinateConfigurationField[\s\S]*:model-value="itemPosition"[\s\S]*@update:model-value="updateItemPosition"[\s\S]*@pick="pickItemPosition"/)
  assert.match(view, /const itemPosition = ref\(\{ \.\.\.settingsStore\.itemPosition \}\)/)
  assert.match(view, /watch\(\(\) => settingsStore\.itemPosition,[\s\S]*itemPosition\.value = \{ \.\.\.value \}/)
  assert.match(view, /settingsStore\.updateItemPosition\(itemPosition\.value\)/)
  assert.match(help, /prerequisite: '单件模式需配置物品位置；批量模式需配置原生背包网格，并由用户自行打开角色背包和通货页面后手动扫描。/)

  const pickStart = view.indexOf('async function pickItemPosition()')
  const pickEnd = view.indexOf('async function handleSave', pickStart)
  const pick = view.slice(pickStart, pickEnd)
  assert.match(pick, /if \(itemPositionPicking\.value\) return/)
  assert.match(pick, /if \(!result \|\| result\.canceled\) return/)
  assert.match(pick, /if \(result\.success === false\) throw new Error/)
  assert.ok(pick.indexOf('result.canceled') < pick.indexOf('updateItemPosition(point)'))
  assert.match(pick, /finally \{\s*itemPositionPicking\.value = false/)
})

test('地图制作详情页复用地图启动服务并阻止重复或并行启动', () => {
  const view = source('../src/domains/map/MapView.vue')

  assert.match(view, /import \{ commitGlobalShortcut, startMapRolling \} from ['"]@\/utils\/scriptService['"]/)
  assert.match(view, /const starting = ref\(false\)/)
  assert.match(view, /const isCurrentModeRunning = computed\(\(\) => scriptStore\.isRunning && scriptStore\.mode === 'map'\)/)
  assert.match(view, /:loading="starting"/)
  assert.match(view, /:disabled="starting \|\| scriptStore\.isRunning"/)
  assert.match(view, /\{\{ isCurrentModeRunning \? '运行中' : '启动' \}\}/)
  assert.match(view, /async function handleStart\(\)[\s\S]*starting\.value = true[\s\S]*await startMapRolling\(\)[\s\S]*starting\.value = false/)
})
