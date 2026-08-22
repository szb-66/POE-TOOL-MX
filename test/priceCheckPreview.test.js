import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { createPriceCheckPreview } from '../src/domains/priceCheck/priceCheckPreview.js'

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('查价预览样例固定覆盖名称、大类、属性、状态和词缀', () => {
  const preview = createPriceCheckPreview()

  assert.equal(preview.state.model.identity.name, '意志交锋')
  assert.equal(preview.state.model.identity.category, 'armour.helmet')
  assert.equal(preview.state.model.item.category, '头盔')
  assert.ok(preview.state.model.properties.length > 0)
  assert.ok(Object.hasOwn(preview.state.model.stateFilters, 'identified'))
  assert.ok(preview.state.model.stats.length > 0)
  assert.equal(preview.state.result, null)
})

test('查价预览每次创建深度独立状态和查询选项', () => {
  const first = createPriceCheckPreview()
  const second = createPriceCheckPreview()

  first.state.model.identity.nameEnabled = false
  first.state.model.properties[0].enabled = false
  first.state.model.stats[0].min = 1
  first.options.status = 'any'

  assert.equal(second.state.model.identity.nameEnabled, true)
  assert.equal(second.state.model.properties[0].enabled, true)
  assert.equal(second.state.model.stats[0].min, 82)
  assert.equal(second.options.status, 'available')
})

test('查价组件预览模式隔离生命周期与外部操作', () => {
  const view = source('src/domains/priceCheck/PriceCheckOverlayView.vue')

  assert.match(view, /const props = defineProps\([\s\S]*previewMode[\s\S]*previewState[\s\S]*previewOptions/)
  assert.match(view, /import \{[^}]*toRaw[^}]*\} from 'vue'/)
  assert.match(view, /function clonePreviewInput\(value\) \{\s*return value == null \? value : structuredClone\(toRaw\(value\)\)\s*\}/)
  assert.match(view, /const state = ref\(props\.previewMode \? clonePreviewInput\(props\.previewState\) : null\)/)
  assert.match(view, /props\.previewMode && props\.previewOptions \? clonePreviewInput\(props\.previewOptions\) : \{\}/)
  assert.match(view, /if \(props\.previewMode\) return[\s\S]*priceCheck\.updateSettings/)
  assert.match(view, /onMounted\(\(\) => \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function close\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function openOfficial\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function rerun\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function loadMore\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function retryCatalog\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function resolveIdentity\(candidateKey\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function selectStatCandidate\(unknown, candidate\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function copyWhisper\(text\) \{\s*if \(props\.previewMode\) return/)
})

test('查价预览保留本地交互并禁用搜索、网页市集和关闭', () => {
  const view = source('src/domains/priceCheck/PriceCheckOverlayView.vue')

  assert.match(view, /v-if="props\.previewMode" class="preview-badge">预览模式/)
  assert.match(view, /class="close-button"[\s\S]*:disabled="props\.previewMode"/)
  assert.match(view, /class="primary"[\s\S]*:disabled="props\.previewMode \|\| busy/)
  assert.match(view, /class="secondary"[\s\S]*:disabled="props\.previewMode \|\| state\.status !== 'ready'"/)
  assert.match(view, /\.overlay-shell\.preview \{[^}]*height: 640px;[^}]*min-height: 0;/)
  assert.match(view, /\.overlay-shell\.preview \.content \{ height: calc\(100% - 38px\);/)
  assert.match(view, /\.overlay-shell\.preview \.topbar \{[^}]*-webkit-app-region: no-drag;/)
})
