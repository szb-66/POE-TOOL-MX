import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  formatJunfengButtonLabel,
  normalizeJunfengProgress
} from '../electron/modules/junfeng/progress.js'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('君锋镇按钮只有空闲和运行进度两类文案', () => {
  assert.equal(formatJunfengButtonLabel(), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'completed', processedItems: 2, candidateItems: 2 }), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'stopped', processedItems: 1, candidateItems: 2 }), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'running' }), '进行中（0/0）')
  assert.equal(formatJunfengButtonLabel({ status: 'running', processedItems: 1, candidateItems: 2 }), '进行中（1/2）')
})

test('候选进度使用已处理序号并钳制到归并后的候选总数', () => {
  assert.deepEqual(normalizeJunfengProgress(1, 2), { processedItems: 1, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress(5, 2), { processedItems: 2, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress(-1, 2), { processedItems: 0, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress('invalid', 'invalid'), { processedItems: 0, candidateItems: 0 })

  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /event\.currentIndex \?\? this\.status\.processedItems/)
  assert.match(manager, /processedItems: progress\.processedItems/)

  const pickup = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(pickup, /skipped=True/)
  assert.match(pickup, /emit\("progress", currentIndex=index \+ 1/)
})

test('君锋镇浮窗运行中禁用单向启动按钮并保留全局 End 停止', () => {
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(view, /:disabled="state\.junfengRunning \|\| !state\.canJunfeng \|\| Boolean\(busy\)"/)
  assert.match(view, /\? await electronApi\.junfeng\.start\(\)/)
  assert.doesNotMatch(view, /electronApi\.junfeng\.stop\(\)/)
  assert.match(view, /busy\.value === 'junfeng'[\s\S]*'进行中（0\/0）'/)
  assert.doesNotMatch(view, /busy === 'junfeng' \? '处理中/)

  const emergencyIpc = source('electron/modules/ipc/emergencyStop.js')
  assert.match(emergencyIpc, /managerAction\('junfeng', '君锋镇取件', junfeng\)/)
})

test('君锋镇模式仅保留拖动柄和按钮，其他模式继续显示状态行', () => {
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(view, /:class="\{ 'junfeng-only': state\.rewardDetected \}"/)
  assert.match(view, /<div v-if="!state\.rewardDetected" class="status-message"/)
  assert.match(view, /\.control-shell\.junfeng-only\s*\{[^}]*grid-template-rows:[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
  assert.match(view, /\.control-shell\.junfeng-only \.drag-handle \{ grid-row: 1; \}/)
  assert.match(view, /ResizeObserver\(reportContentSize\)/)
  assert.match(view, /electronApi\.chaosRecipe\.resizeControl/)
})
