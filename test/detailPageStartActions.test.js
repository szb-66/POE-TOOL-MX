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
  assert.match(view, /async function handleStart\(\)[\s\S]*starting\.value = true[\s\S]*await startCrafting\(\)[\s\S]*starting\.value = false/)
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
