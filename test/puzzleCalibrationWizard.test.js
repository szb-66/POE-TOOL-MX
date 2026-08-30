import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

test('引导校准弹窗左右展示原图与识别结果并逐项立即保存', () => {
  const wizard = source('src/domains/puzzle/PuzzleCalibrationWizard.vue')
  assert.match(wizard, /class="wizard-body"[\s\S]*class="source-panel"[\s\S]*本轮原图[\s\S]*class="result-panel"[\s\S]*识别结果与修正/)
  assert.match(wizard, /第 \{\{ current\.page \}\} 页[\s\S]*current\.row \+ 1[\s\S]*current\.column \+ 1/)
  assert.match(wizard, /current\.typeLocked[\s\S]*类型来自游戏复制文本，只能校准方向/)
  assert.match(wizard, /label="空格" value="empty"[\s\S]*v-for="option in typeOptions"/)
  assert.match(wizard, /await store\.saveCalibrationItem\(key,[\s\S]*completedCount\.value \+= 1/)
  assert.match(wizard, /catch \(caught\)[\s\S]*当前校准项保存失败/)
  assert.match(wizard, /保存并下一个/)
})

test('本机素材管理保持独立入口，未知候选在网格中不伪装为空格', () => {
  const view = source('src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /校准本机素材（\{\{ calibrationQueueCount \}\}）/)
  assert.match(view, /素材管理（\{\{ calibrationSamples\.length \}\}）/)
  assert.match(view, /v-else-if="slot\.candidate" class="candidate-mark">\?<\/span>/)
  assert.match(view, /:disabled="slot\.typeSource === 'copy'"/)
})
