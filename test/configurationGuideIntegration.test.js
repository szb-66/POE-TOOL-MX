import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { configurationIssueFromFailure } from '../src/domains/configurationGuide/configurationFailures.js'

const source = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

test('应用壳只挂载一个引导宿主且不在启动时主动打开', () => {
  const app = source('src/App.vue')
  assert.match(app, /<template v-if="!route\.meta\.noLayout">[\s\S]*<ConfigurationGuideDialog \/>/)
  assert.equal((app.match(/<ConfigurationGuideDialog \/>/g) || []).length, 1)
  assert.doesNotMatch(app, /runWithConfigurationGuide|configurationGuideStore\.(?:open|visible\s*=)/)
})

test('引导编辑区约束滚动容器，底部取消与继续操作不会被内容遮挡', () => {
  const dialog = source('src/domains/configurationGuide/ConfigurationGuideDialog.vue')
  assert.doesNotMatch(dialog, /只有你点击底部继续按钮后才会重新校验并执行/)
  assert.match(dialog, /<el-scrollbar class="configuration-guide__scroll" max-height="56vh">/)
  assert.match(dialog, /\.configuration-guide__body \{[^}]*height: clamp\(360px, 56vh, 560px\);[^}]*min-height: 0;/)
  assert.match(dialog, /\.configuration-guide__editor \{[^}]*display: flex;[^}]*min-height: 0;[^}]*overflow: hidden;/)
  assert.match(dialog, /\.configuration-guide__scroll \{[^}]*min-height: 0;[^}]*flex: 1 1 auto;/)
})

test('设置页、功能页与引导共用真实配置组件', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  const interfaceSettings = source('src/domains/settings/InterfaceDetectionSettings.vue')
  const combat = source('src/domains/combat/CombatView.vue')
  const bag = source('src/domains/bag/BagView.vue')
  const shop = source('src/domains/shop/ChaosRecipePanel.vue')
  const guide = source('src/domains/configurationGuide/ConfigurationIssueEditor.vue')

  for (const component of ['CoordinateConfigurationField', 'InventoryGridConfigurationField', 'AccountLeagueConfigurationField']) {
    assert.match(settings, new RegExp(component))
    assert.match(guide, new RegExp(component))
  }
  assert.match(interfaceSettings, /TemplateCaptureConfigurationField/)
  assert.match(bag, /TemplateCaptureConfigurationField/)
  assert.match(guide, /TemplateCaptureConfigurationField/)
  assert.match(combat, /CoordinateConfigurationField/)
  assert.match(combat, /KeySequenceCapture/)
  assert.match(guide, /CoordinateConfigurationField/)
  assert.match(guide, /KeySequenceCapture/)
  for (const component of ['StashGridConfigurationField', 'ShopStashTabConfigurationField']) {
    assert.match(shop, new RegExp(component))
    assert.match(guide, new RegExp(component))
  }
})

test('批量制作未选类别时引导直接显示扫描类别而不显示词缀配置', () => {
  const guide = source('src/domains/configurationGuide/ConfigurationIssueEditor.vue')
  const categoryBranch = guide.slice(
    guide.indexOf(`issue.editorId === 'preset.items.batch-categories'`),
    guide.indexOf(`issue.editorId === 'preset.items'`)
  )
  assert.match(categoryBranch, /batchCategories/)
  assert.match(categoryBranch, /saveBatchCategories/)
  assert.doesNotMatch(categoryBranch, /ModuleTwo|ModuleEldritch|ModuleThree/)
})

test('详情页、仪表盘和全局快捷键复用受保护的动作入口', () => {
  const guardedFiles = [
    'src/utils/scriptService.js',
    'src/utils/bagService.js',
    'src/utils/combatService.js',
    'src/stores/stashPickup.js',
    'src/stores/junfeng.js',
    'src/stores/chaosRecipe.js',
    'src/stores/priceCheck.js',
    'src/stores/puzzle.js'
  ]
  for (const file of guardedFiles) {
    const contents = source(file)
    assert.match(contents, /runWithConfigurationGuide/, `${file} 必须接入统一门禁`)
    assert.match(contents, /configurationGuideBypass/, `${file} 必须在显式继续时才绕过弹窗并重新进入原动作`)
  }

  const shortcuts = source('src/utils/scriptService.js')
  for (const binding of [
    /itemStart: startCrafting/,
    /mapStart: startMapRolling/,
    /potionStart: startPotionAssist/,
    /portal: executePortalAssist/,
    /chaosRecipeStart: startChaosRecipePicking/,
    /puzzleAnalyze: startPuzzleAnalysis/,
    /priceCheck: startPriceCheck/
  ]) assert.match(shortcuts, binding)

  const dashboard = source('src/domains/dashboard/useDashboard.js')
  for (const action of [
    'startCrafting', 'startMapRolling', 'setBagModuleEnabled', 'startPotionAssist',
    'startLoopAssist', 'stashPickupStore.setEnabled', 'junfengStore.setEnabled',
    'chaosRecipeStore.setEnabled', 'priceCheckStore.setEnabled'
  ]) assert.match(dashboard, new RegExp(action.replace('.', '\\.')))
})

test('配置导致的不可用动作保持可点，运行中与资源冲突仍禁用', () => {
  const dashboard = source('src/domains/dashboard/useDashboard.js')
  assert.match(dashboard, /run: startCrafting/)
  assert.match(dashboard, /run: startMapRolling/)
  assert.doesNotMatch(dashboard, /disabled:\s*!itemValidation\.value\.isValid/)
  assert.doesNotMatch(dashboard, /disabled:\s*!mapValidation\.value\.isValid/)

  const puzzle = source('src/domains/puzzle/PuzzleView.vue')
  assert.match(puzzle, /return autoPlaceConfigurationCheck\.value\.ok \? !canAutoPlace\.value : false/)
  assert.match(puzzle, /:disabled="executing \|\| probingBorder" @click="startAnalysis"/)

  const shop = source('src/domains/shop/ChaosRecipePanel.vue')
  assert.match(shop, /<el-switch[\s\S]*@change="toggleEnabled"/)
  assert.doesNotMatch(shop, /<el-switch[\s\S]{0,240}:disabled="[^\"]*(?:league|authenticated|selectedTab)/)
})

test('结构化纠错只依赖失败码和问题 ID，不从中文文案推断', () => {
  assert.equal(configurationIssueFromFailure({
    moduleId: 'items',
    actionId: 'start',
    failureCode: 'UNKNOWN_RUNTIME_FAILURE',
    message: '通货坐标错误，请重新定位改造石'
  }), null)

  const mapper = source('src/domains/configurationGuide/configurationFailures.js')
  assert.doesNotMatch(mapper, /message\.(?:includes|match|test|startsWith)/)
  assert.match(mapper, /TEMPORARY_FAILURE_CODES/)
  assert.match(mapper, /issueBelongsToAction/)
})

test('制作浮窗的重新定位与手动重试是完全分离的两个动作', () => {
  const overlay = source('src/domains/overlay/OverlayView.vue')
  const retryBody = overlay.slice(overlay.indexOf('async function handleRetry'), overlay.indexOf('async function handleRelocate'))
  const relocateBody = overlay.slice(overlay.indexOf('async function handleRelocate'), overlay.indexOf('function handleClose'))
  assert.match(retryBody, /retryAutomationWithLatestConfig/)
  assert.match(relocateBody, /configurationGuide\.openFromOverlay/)
  assert.doesNotMatch(relocateBody, /retryAutomationWithLatestConfig|startCrafting|startMapRolling/)

  const dialog = source('src/domains/configurationGuide/ConfigurationGuideDialog.vue')
  assert.match(dialog, /execute: \(\) => electronApi\.configurationGuide\.returnToOverlay\(\)/)
  assert.doesNotMatch(dialog, /retryAutomationWithLatestConfig/)
})

test('Python 预检和其他运行管理器保留稳定纠错上下文', () => {
  for (const file of ['src/assets/scripts/crafting_template.py', 'src/assets/scripts/map_rolling_template.py']) {
    const contents = source(file)
    for (const code of ['CONFIGURATION_MISSING', 'CURRENCY_NOT_FOUND', 'CURRENCY_TYPE_MISMATCH', 'CLIPBOARD_UNAVAILABLE']) {
      assert.match(contents, new RegExp(`\"${code}\"`))
    }
    assert.match(contents, /"configurationIssueId": f"currency\.\{currency\}"/)
    assert.match(contents, /"expected": expected/)
    assert.match(contents, /"actual": actual/)
    assert.match(contents, /"position":/)
  }

  for (const file of [
    'electron/modules/interfaceDetection/coordinator.js',
    'electron/modules/stashPickup/manager.js',
    'electron/modules/junfeng/manager.js',
    'src/assets/scripts/combat_assist_template.py',
    'src/stores/puzzle.js'
  ]) {
    const contents = source(file)
    assert.match(contents, /failureCode/)
    assert.match(contents, /configurationIssueId/)
  }
})
