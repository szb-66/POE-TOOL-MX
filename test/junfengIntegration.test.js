import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AutomationLock } from '../electron/modules/automation/lock.js'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('君锋镇接入独立 manager、IPC、preload、store 和自动化互斥锁', () => {
  const main = source('electron/main.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  const preload = source('electron/preload.cjs')
  const manager = source('electron/modules/junfeng/manager.js')
  const store = source('src/stores/junfeng.js')
  assert.match(main, /new JunfengHighlightManager/)
  assert.match(ipc, /junfeng-runtime-update/)
  assert.match(ipc, /registerConsumer\('junfeng-highlight'/)
  assert.match(preload, /onJunfengEvent/)
  assert.match(preload, /onJunfengTrainingEvent/)
  assert.match(store, /candidateItems/)
  assert.match(manager, /acquire\(OWNER\)/)
  assert.match(manager, /release\(OWNER\)/)
  assert.match(manager, /'small-stash': \{ columns: 12, rows: 12 \}/)
  assert.match(manager, /'large-stash': \{ columns: 24, rows: 24 \}/)
  assert.match(ipc, /junfeng-training-start/)
  assert.match(ipc, /junfeng-training-update-session/)
  assert.match(ipc, /junfeng-training-delete-session/)
  assert.match(store, /saveTrainingSession/)
  assert.match(store, /reviewTrainingSession/)
  const lock = new AutomationLock()
  assert.equal(lock.acquire('自动入库').success, true)
  assert.equal(lock.acquire('君锋镇取出高亮').success, false)
})

test('奖励界面优先显示取出高亮并隐藏普通仓库按钮', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(manager, /rewardDetected \? junfengVisible : normalVisible/)
  assert.match(manager, /junfengButtonLabel/)
  assert.match(manager, /getAvailability/)
  assert.match(view, /取出高亮/)
  assert.match(view, /v-if="state\.junfengEnabled && state\.rewardDetected"/)
  assert.match(view, /v-if="state\.stashPickupEnabled"[\s\S]*v-show="!state\.rewardDetected"/)
  assert.match(view, /electronApi\.junfeng\.start/)
})

test('正式取件只有一次全网格分类并使用三轮复制确认保护', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const shared = source('src/assets/scripts/bag_auto_stash_template.py')
  const classifyStart = script.indexOf('cells, groups, uncertain = classify(image, config, model, calibration)')
  const loopStart = script.indexOf('for index, candidate in enumerate(candidates):')
  assert.ok(classifyStart > 0 && loopStart > classifyStart)
  assert.equal((script.slice(classifyStart, loopStart).match(/classify\(/g) || []).length, 1)
  assert.match(script, /if uncertain and bool\(config\.get\("abort_on_uncertain", True\)\):[\s\S]*reason="uncertain-cells"/)
  assert.match(script, /require_game_foreground\(\)[\s\S]*transfer_pickup_item/)
  assert.match(shared, /def transfer_pickup_item\(controller\):[\s\S]*for _attempt in range\(3\):/)
  assert.match(script, /reason="transfer-unconfirmed"/)
  assert.match(shared, /return False, "inventory-full"/)
})

test('普通仓库和君锋镇共享候选复制判空路径，已知占位可提前跳过', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(script, /candidates = ordered_candidates\(groups\)/)
  assert.match(script, /key=lambda candidate: \(candidate\["row"\], candidate\["column"\]\)/)
  assert.match(script, /copy_item_text\(\)[\s\S]*before_status == "empty"[\s\S]*transfer_pickup_item/)
  assert.match(script, /resolved_footprint_slots\([\s\S]*resolved_slots\.update/)
  assert.doesNotMatch(script, /transfer_confirmation|wait_for_candidate_change/)
  assert.equal((script.match(/mouse\.position = park_position/g) || []).length, 1)
  assert.doesNotMatch(script, /changed_candidate_cells|cleared_cells/)
  assert.doesNotMatch(script, /next_position|source_patch/)
  assert.doesNotMatch(script, /InterfaceMatcher|require_action_ready|check_interface/)
})

test('主界面触发检测预览允许暂时失焦，正式取件仍要求奖励标题处于检测状态', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /preview\(\)\s*{\s*this\.ensureReady\(\{ modelRequired: false, requireReward: false \}\)/)
  assert.match(manager, /start\(\)\s*{[\s\S]*?this\.ensureReady\(\)/)
  assert.match(manager, /if \(requireReward && !detection\.rewardDetected\)/)
})

test('君锋镇按钮依赖公共标题检测，执行阶段只因失去前台停止', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const overlay = source('electron/modules/chaosRecipe/controlOverlay.js')
  const subscription = manager.slice(
    manager.indexOf('this.disposeDetection = interfaceDetection?.subscribe'),
    manager.indexOf('  initialStatus()')
  )

  assert.match(subscription, /!state\.foreground/)
  assert.doesNotMatch(subscription, /junfengReady|reward-interface-lost/)
  assert.match(overlay, /const rewardDetected = junfengRunning \|\|/)
  assert.match(overlay, /junfengRunning \|\| \(junfengReady && junfengAvailability\.ready && !junfengOccupied\)/)
})

test('普通仓库和君锋镇均跳过模糊格继续取件', () => {
  const stashManager = source('electron/modules/stashPickup/manager.js')
  const junfengManager = source('electron/modules/junfeng/manager.js')
  assert.match(stashManager, /abort_on_uncertain: false/)
  assert.match(junfengManager, /abort_on_uncertain: false/)
})

test('通用训练框选的嵌套区域在写入 Python 配置前归一化为扁平物理坐标', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /grid_region: normalizeJunfengRegion\(overrides\.gridRegion \|\| this\.runtime\.gridRegion\)/)
  assert.match(manager, /previewTraining\(\{ domain, gridRegion, partition = 'train' \} = \{\}\)/)
})

test('君锋镇和仓库只在启动前校验标题，正式取件配置不再携带标题门禁', () => {
  const junfengManager = source('electron/modules/junfeng/manager.js')
  const stashManager = source('electron/modules/stashPickup/manager.js')
  for (const manager of [junfengManager, stashManager]) {
    const writeConfig = manager.slice(manager.indexOf('  writeConfig('), manager.indexOf('  spawn', manager.indexOf('  writeConfig(')))
    assert.doesNotMatch(writeConfig, /templates|match_threshold|interface_mode/)
  }
  assert.match(junfengManager, /if \(requireReward && !detection\.rewardDetected\)/)
  assert.match(stashManager, /if \(detection\.foreground && !detection\.ready\)/)
  assert.doesNotMatch(junfengManager, /transfer_confirmation/)
  assert.doesNotMatch(stashManager, /transfer_confirmation/)
  assert.match(junfengManager, /'pynput', 'pyperclip'/)
  assert.match(stashManager, /'pynput', 'pyperclip'/)
  assert.match(source('src/domains/bag/BagView.vue'), /'transfer-unconfirmed': '无法确认物品已转移，已安全停止'/)
})

test('君锋镇可用性校验模板采集环境和网格物理边界', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const config = source('src/utils/junfengConfig.js')
  assert.match(manager, /validateTemplateCaptureEnvironment/)
  assert.match(manager, /junfengRewardCapture/)
  assert.match(manager, /inventoryCapture/)
  assert.match(manager, /validateJunfengGridEnvironment\(runtime\.gridRegion, this\.currentDisplays\(\)\)/)
  assert.match(config, /region\.displayPhysicalBounds/)
  assert.match(config, /分辨率或位置已变化/)
})

test('校准素材导出保留仓库与君锋镇来源域', () => {
  const builder = source('scripts/junfeng/build_calibration_dataset.py')
  assert.match(builder, /str\(sample\.get\("domain"\) or "junfeng"\)/)
  assert.doesNotMatch(builder, /args\.repeat, "junfeng-calibration"/)
})

test('有效模型可直接用于正式取件且准确率报告只作为质量参考', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(script, /validate_model\(config\)/)
  assert.doesNotMatch(script, /model-not-approved|require_approved/)
  assert.doesNotMatch(manager, /!manifest\.automationEnabled|!manifest\.benchmark\?\.passed/)
  assert.match(manager, /fileSha256\(paths\.model\)/)
})

test('检测预览在截图前把鼠标停到当前显示器且位于网格之外', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(script, /park_position = park_cursor_position\(config\.get\("grid_region", \{\}\), rect\)/)
  assert.match(script, /mouse\.position = park_position[\s\S]*time\.sleep\(normalize_operation_delay\(config\.get\("operation_delay_ms"\)\) \/ 1000\.0\)[\s\S]*image = capture\(rect, grabber\)/)
})

test('检测与训练标注直接覆盖在原始预览截图上并支持点击循环标签', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const pickupView = source('src/domains/bag/BagView.vue')
  const trainingView = source('src/domains/bag/HighlightModelTrainingView.vue')
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(script, /rawImageDataUrl=data_url\(image\)/)
  assert.match(pickupView, /<HighlightGridPreview[\s\S]*decision-mode[\s\S]*editable/)
  assert.match(trainingView, /<HighlightGridPreview[\s\S]*:labels="junfengStore\.trainingLabels"[\s\S]*editable/)
  assert.match(gridPreview, /highlighted: 'dimmed', dimmed: 'empty', empty: 'highlighted'/)
  assert.match(gridPreview, /emit\('change', \{ cell, label: nextLabel\(effectiveLabel\(cell\)\) \}\)/)
})

test('训练标注网格可独立切换彩色边框和同色中心圆点', () => {
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(gridPreview, /const showGridColors = ref\(true\)/)
  assert.match(gridPreview, /const showCenterDots = ref\(true\)/)
  assert.match(gridPreview, /v-model="showGridColors" active-text="显示网格颜色"/)
  assert.match(gridPreview, /v-model="showCenterDots" active-text="显示中心圆点"/)
  assert.match(gridPreview, /'is-grid-color-hidden': !showGridColors/)
  assert.match(gridPreview, /'is-center-dot-hidden': !showCenterDots/)
  assert.match(gridPreview, /\.highlight-grid-preview__cell::after[^{]*\{[^}]*background: var\(--highlight-label-color\)/)
  assert.match(gridPreview, /\.is-highlighted \{ --highlight-label-color: rgba\(65, 220, 92, 0\.95\)/)
  assert.match(gridPreview, /\.is-dimmed \{ --highlight-label-color: rgba\(205, 210, 218, 0\.88\)/)
  assert.match(gridPreview, /\.is-empty \{ --highlight-label-color: rgba\(255, 255, 255, 0\.28\)/)
  assert.match(gridPreview, /\.is-grid-color-hidden \.highlight-grid-preview__cell \{ border-color: transparent/)
  assert.match(gridPreview, /\.is-center-dot-hidden \.highlight-grid-preview__cell::after \{ display: none/)
})

test('训练图片图例实时展示当前标注的高亮灰暗和空格数量', () => {
  const trainingView = source('src/domains/bag/HighlightModelTrainingView.vue')
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(trainingView, /const trainingLabelCounts = computed\(\(\) => Object\.values\(junfengStore\.trainingLabels\)\.reduce/)
  assert.match(trainingView, /\{ highlighted: 0, dimmed: 0, empty: 0, unknown: 0 \}/)
  assert.match(gridPreview, /高亮 \{\{ counts\.highlighted \}\}/)
  assert.match(gridPreview, /灰暗 \{\{ counts\.dimmed \}\}/)
  assert.match(gridPreview, /空格 \{\{ counts\.empty \}\}/)
  assert.match(trainingView, /const trainingUnknownCount = computed\(\(\) => trainingLabelCounts\.value\.unknown\)/)
})

test('训练标注保存成功后关闭当前图片并退出复核状态', () => {
  const store = source('src/stores/junfeng.js')
  assert.match(store, /async function saveTrainingSession\(\)[\s\S]*await loadTrainingSessions\(\)[\s\S]*trainingPreview\.value = null[\s\S]*trainingLabels\.value = \{\}[\s\S]*reviewingSessionId\.value = ''[\s\S]*return summary/)
})

test('历史标注会话可按来源和用途组合筛选并保留全量测试计数', () => {
  const view = source('src/domains/bag/HighlightModelTrainingView.vue')
  assert.match(view, /const sessionDomainFilter = ref\(''\)/)
  assert.match(view, /const sessionPartitionFilter = ref\(''\)/)
  assert.match(view, /v-model="sessionDomainFilter"[\s\S]*label="全部来源" value=""/)
  assert.match(view, /v-model="sessionPartitionFilter"[\s\S]*label="全部用途" value=""/)
  assert.match(view, /const filteredTrainingSessions = computed\(\(\) => junfengStore\.trainingSessions\.filter\(session =>[\s\S]*!sessionDomainFilter\.value \|\| session\.domain === sessionDomainFilter\.value[\s\S]*&&[\s\S]*!sessionPartitionFilter\.value \|\| session\.partition === sessionPartitionFilter\.value/)
  assert.match(view, /:data="filteredTrainingSessions"/)
  assert.match(view, /filteredTrainingSessions\.length \}\} \/ \{\{ junfengStore\.trainingSessions\.length/)
  assert.match(view, /v-else-if="junfengStore\.trainingSessions\.length"[\s\S]*description="没有符合筛选条件的历史标注会话"/)
  assert.match(view, /const testSessionCount = computed\(\(\) => junfengStore\.trainingSessions\.filter/)
  assert.doesNotMatch(view, /const testSessionCount = computed\(\(\) => filteredTrainingSessions/)
})

test('独立训练页面可视化复核历史会话并直接更新当前模型', () => {
  const router = source('src/router/index.js')
  const pageLoaders = source('src/router/pageLoaders.js')
  const sidebar = source('src/components/Layout/Sidebar.vue')
  const bagView = source('src/domains/bag/BagView.vue')
  const view = source('src/domains/bag/HighlightModelTrainingView.vue')
  const repository = source('electron/modules/junfeng/calibrationRepository.js')
  const benchmark = source('scripts/junfeng/benchmark_model.py')
  assert.match(router, /const developmentRoutes = import\.meta\.env\.DEV \? \[/)
  assert.match(router, /path: '\/highlight-model-training'/)
  assert.match(router, /!import\.meta\.env\.DEV && to\.path === '\/highlight-model-training'[\s\S]*path: '\/'/)
  assert.match(pageLoaders, /import\.meta\.env\.DEV \? \{[\s\S]*'\/highlight-model-training':[\s\S]*HighlightModelTrainingView\.vue/)
  assert.match(sidebar, /v-if="isModelTrainingEnabled"[\s\S]*模型训练/)
  assert.match(sidebar, /const isModelTrainingEnabled = import\.meta\.env\.DEV/)
  assert.doesNotMatch(bagView, /历史标注会话|GPU 训练并更新当前模型/)
  assert.match(view, /历史标注会话/)
  assert.match(view, /保存复核修改/)
  assert.match(view, /全部高亮/)
  assert.match(view, /最终测试集（质量评估）/)
  assert.match(view, /GPU 训练并更新当前模型/)
  assert.match(view, /运行最终测试（可选）/)
  assert.match(view, /在原图中查看/)
  assert.match(repository, /reconstructedGridDataUrl/)
  assert.match(repository, /revision: Number\(previousSession\?\.revision \|\| 0\) \+ 1/)
  assert.match(benchmark, /"errors": errors/)
})

test('正式版不注册君锋镇训练 IPC，普通取件 IPC 保持可用', () => {
  const main = source('electron/main.js')
  const ipcIndex = source('electron/modules/ipc/index.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  assert.match(main, /enableJunfengTraining: !app\.isPackaged/)
  assert.match(ipcIndex, /enableJunfengTraining = false/)
  assert.match(ipcIndex, /enableTraining: enableJunfengTraining/)
  assert.match(ipc, /ipcMain\.handle\('junfeng-status'/)
  assert.match(ipc, /if \(!enableTraining\) return[\s\S]*ipcMain\.handle\('junfeng-training-pick-region'/)
  assert.match(ipc, /ipcMain\.handle\('junfeng-training-start'/)
})

test('公共检测独立上报普通仓库与奖励状态并在背包变化时刷新君锋镇就绪状态', () => {
  const python = source('src/assets/scripts/bag_auto_stash_template.py')
  const coordinator = source('electron/modules/interfaceDetection/coordinator.js')
  assert.match(python, /rewardDetected=reward_detected/)
  assert.match(python, /junfeng_ready = reward_detected and matches\["inventoryMatched"\]/)
  assert.match(python, /inventory_changed = matches\["inventoryMatched"\] != last_inventory_matched/)
  assert.match(coordinator, /stashReady: Boolean\(event\.stashReady \?\? event\.ready\)/)
  assert.match(coordinator, /rewardDetected: Boolean\(event\.rewardDetected\)/)
  assert.match(coordinator, /rewardScore: event\.rewardScore/)
})

test('开发训练工具按会话划分并独立评估零误报、召回率和零高亮场景', () => {
  const train = source('scripts/junfeng/train_model.py')
  const benchmark = source('scripts/junfeng/benchmark_model.py')
  assert.match(train, /validation_sessions/)
  assert.doesNotMatch(train, /random_split/)
  assert.match(train, /output_names=\["logits", "embedding"\]/)
  assert.match(benchmark, /false_positive == 0 and recall >= 0\.99 and zero_scene_clicks == 0/)
  assert.doesNotMatch(benchmark, /--approve|automationEnabled/)
  assert.match(benchmark, /最终测试集至少需要 3 个已审计独立会话/)
  assert.match(train, /partition not in \("validation", "test"\)/)
})

test('训练先完成候选模型验证再发布当前模型并保留失败回滚', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const benchmark = manager.indexOf("this.publishTraining({ stage: '独立验证候选模型' })")
  const publish = manager.indexOf('this.publishCandidateModel(candidate)', benchmark)
  assert.ok(benchmark > 0 && publish > benchmark)
  assert.match(manager, /candidateRoot = path\.join\(paths\.artifacts, 'workbench-candidate'\)/)
  assert.match(manager, /backup: `\$\{target\}\.\$\{token\}\.backup`/)
  assert.match(manager, /entry\.replaced && entry\.existed[\s\S]*copyFileSync\(entry\.backup, entry\.target\)/)
})
