<template>
  <div class="bag-page">
    <el-scrollbar>
      <div class="bag-content">
        <div class="section-header"><h3 class="section-title">背包安全自动入库</h3></div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="启用模块">
              <el-switch :model-value="bagStore.moduleEnabled" active-text="开启" inactive-text="关闭" @change="handleModuleToggle" />
              <span class="hint-text inline-hint">同一次打开仓库会话只自动执行一轮</span>
            </el-form-item>
            <el-form-item label="显示检测区域">
              <el-switch v-model="showDebugOverlay" active-text="显示" inactive-text="隐藏" />
            </el-form-item>
            <el-form-item label="手动补扫快捷键">
              <KeyCaptureInput :model-value="settingsStore.globalShortcuts.stashStart" @change="saveStashShortcut" />
            </el-form-item>
            <el-form-item label="检测状态">
              <el-tag :type="detectionStatus.type">{{ detectionStatus.text }}</el-tag>
            </el-form-item>
            <el-form-item v-if="bagStore.isStashing" label="扫描进度">
              <el-progress :percentage="bagStore.stashProgress" :text-inside="true" :stroke-width="20" />
            </el-form-item>
            <el-form-item v-if="hasRunStats" label="本轮统计">
              <div class="stats-row">
                <el-tag type="success">已入库 {{ bagStore.stashStats.stashedSlots }}</el-tag>
                <el-tag type="warning">黑名单 {{ bagStore.stashStats.blacklistedSlots }}</el-tag>
                <el-tag type="info">空格 {{ bagStore.stashStats.emptySlots }}</el-tag>
                <el-tag type="danger">未识别 {{ bagStore.stashStats.unreadableSlots }}</el-tag>
              </div>
            </el-form-item>
            <el-form-item v-if="bagStore.lastStopReason" label="停止原因">
              <el-alert :closable="false" type="warning" :title="formatBagStopReason(bagStore.lastStopReason)" />
            </el-form-item>
            <el-form-item v-if="bagStore.moduleEnabled && bagStore.isMatched && !bagStore.isStashing">
              <el-button type="primary" :icon="Upload" @click="startBagStash">手动补扫</el-button>
            </el-form-item>
            <el-form-item v-if="bagStore.isStashing">
              <el-button type="danger" :icon="VideoPause" @click="handleStopStash">停止入库</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="section-header"><h3 class="section-title">物品黑名单</h3></div>
        <el-card class="section-card">
          <el-alert title="命中任一规则的物品会留在背包；统计按扫描格数计算。" type="info" :closable="false" />
          <div class="rule-editor">
            <el-select v-model="draftRule.field" style="width: 150px" :disabled="bagStore.moduleEnabled">
              <el-option v-for="field in BAG_BLACKLIST_FIELDS" :key="field" :label="BAG_BLACKLIST_FIELD_LABELS[field]" :value="field" />
            </el-select>
            <el-input v-model="draftRule.keyword" placeholder="输入包含关键词" clearable :disabled="bagStore.moduleEnabled" @keyup.enter="addBlacklistRule" />
            <el-button type="primary" :disabled="bagStore.moduleEnabled" @click="addBlacklistRule">添加</el-button>
          </div>
          <div v-if="bagStore.moduleEnabled" class="hint-text">请先关闭模块再修改黑名单，重新启用后新规则生效。</div>
          <el-table v-if="bagStore.blacklist.length" :data="bagStore.blacklist" class="rule-table">
            <el-table-column label="匹配字段" width="160">
              <template #default="scope">{{ BAG_BLACKLIST_FIELD_LABELS[scope.row.field] }}</template>
            </el-table-column>
            <el-table-column prop="keyword" label="包含关键词" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button link type="danger" :disabled="bagStore.moduleEnabled" @click="removeBlacklistRule(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无黑名单规则" :image-size="60" />
        </el-card>

        <div class="section-header"><h3 class="section-title">模板配置</h3></div>
        <el-card class="section-card">
          <el-alert v-if="bagStore.moduleEnabled" title="模板可在检测运行时更新并自动重载；匹配参数仍需关闭模块后修改。" type="warning" :closable="false" />
          <div class="template-grid">
            <div v-for="definition in templateDefinitions" :key="definition.type" class="capture-card">
              <div class="capture-card__header">
                <strong>{{ definition.label }}</strong>
                <el-button type="primary" :loading="capturingType === definition.type" :disabled="bagStore.isStashing || Boolean(capturingType)"
                  @click="captureTemplate(definition)">框选{{ definition.shortLabel }}</el-button>
              </div>
              <div class="capture-card__body">
                <img v-if="bagStore.templates[definition.type]" :src="getTemplatePreview(bagStore.templates[definition.type], templatePreviewVersions[definition.type] || bagStore.templates[definition.capture]?.capturedAt)" class="template-preview" />
                <div v-else class="upload-placeholder"><el-icon><Plus /></el-icon><span>尚未配置模板</span></div>
              </div>
              <div class="template-meta">
                <span>模板尺寸：{{ templateSizeText(definition) }}</span>
                <span>搜索区域：{{ regionText(bagStore.templates[definition.region]) }}</span>
              </div>
              <el-alert v-if="bagStore.templates[definition.type] && !bagStore.templates[definition.capture]"
                title="这是旧配置，可继续使用；建议重新框选以提高匹配稳定性。" type="warning" :closable="false" show-icon />
            </div>
          </div>
          <el-collapse v-model="advancedSections" class="advanced-settings">
            <el-collapse-item title="高级设置：上传模板与手工区域" name="templates">
              <el-alert title="高级修改会清除对应模板的采集环境记录。" type="info" :closable="false" />
              <el-form label-width="140px" label-position="left" class="template-form">
                <template v-for="definition in templateDefinitions" :key="definition.type">
                  <el-form-item :label="`${definition.shortLabel}模板`">
                    <el-upload :auto-upload="false" :show-file-list="false" accept="image/*"
                      :disabled="bagStore.isStashing" :on-change="(file) => handleTemplateUpload(file, definition.type)">
                      <el-button :disabled="bagStore.isStashing"><el-icon><Plus /></el-icon>上传图片</el-button>
                    </el-upload>
                  </el-form-item>
                  <el-form-item :label="`${definition.shortLabel}匹配区域`">
                    <div class="region-inputs">
                      <el-input-number v-for="key in regionKeys" :key="key" v-model="bagStore.templates[definition.region][key]"
                        :disabled="bagStore.moduleEnabled" :controls="false" :placeholder="key" @change="saveRegion(definition.type)" />
                    </div>
                  </el-form-item>
                </template>
              </el-form>
            </el-collapse-item>
          </el-collapse>
          <el-form label-width="140px" label-position="left" class="template-form">
            <el-form-item label="匹配阈值">
              <el-slider :model-value="bagStore.matchThreshold" :min="0.1" :max="1" :step="0.05" show-input
                :disabled="bagStore.moduleEnabled" @change="bagStore.setMatchThreshold" />
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload, VideoPause } from '@element-plus/icons-vue'
import { useBagStore } from '@/stores/bag'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { electronApi } from '@/api/electron'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '@/utils/scriptService'
import { formatBagStopReason, setBagModuleEnabled, startBagStash, stopBagStash } from '@/utils/bagService'
import { BAG_BLACKLIST_FIELDS, BAG_BLACKLIST_FIELD_LABELS } from '@/utils/bagConfig'

const bagStore = useBagStore()
const settingsStore = useSettingsStore()
const showDebugOverlay = ref(false)
const capturingType = ref('')
const templatePreviewVersions = ref({})
const advancedSections = ref([])
const draftRule = ref({ field: 'name', keyword: '' })
const regionKeys = ['left', 'top', 'right', 'bottom']
const templateDefinitions = [
  { type: 'stashTitle', region: 'stashRegion', capture: 'stashCapture', label: '仓库标题模板', shortLabel: '仓库标题' },
  { type: 'inventoryTitle', region: 'inventoryRegion', capture: 'inventoryCapture', label: '背包标题模板', shortLabel: '背包标题' }
]

const detectionStatus = computed(() => {
  if (!bagStore.moduleEnabled) return { type: 'info', text: '模块未启用' }
  if (bagStore.isMatched) return { type: 'success', text: '仓库与背包已就绪' }
  return bagStore.isDetecting ? { type: 'warning', text: '等待仓库与背包同时打开' } : { type: 'danger', text: '检测已停止' }
})
const hasRunStats = computed(() => bagStore.stashStats.scannedSlots > 0)

async function handleModuleToggle(enabled) {
  try {
    await setBagModuleEnabled(enabled)
  } catch (error) {
    ElMessage.error(`操作失败：${error.message}`)
  }
}

async function saveStashShortcut(value) {
  try {
    await commitGlobalShortcut('stashStart', value)
    ElMessage.success(`快捷键已更新为：${value}`)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function handleTemplateUpload(file, type) {
  try {
    const result = await electronApi.bag.uploadTemplate(file.raw.path, type)
    if (!result?.success) return ElMessage.error(`上传失败：${result?.error || '未知错误'}`)
    bagStore.setTemplate(type, result.path)
    templatePreviewVersions.value = { ...templatePreviewVersions.value, [type]: result.version || Date.now() }
    if (result.reloadError) ElMessage.warning(`模板图片已上传，但检测器重载失败：${result.reloadError}`)
    else ElMessage.success(result.reloaded ? '模板图片已上传，检测器已重载' : '模板图片已上传')
  } catch (error) {
    ElMessage.error(`上传失败：${error.message}`)
  }
}

async function captureTemplate(definition) {
  if (bagStore.isStashing) return ElMessage.warning('入库进行中，暂时不能替换模板')
  capturingType.value = definition.type
  try {
    const result = await electronApi.bag.captureTemplate(definition.type)
    if (result?.canceled) {
      if (result.error) ElMessage.warning(result.error)
      return
    }
    if (!result?.success) return ElMessage.error(`框选失败：${result?.error || '未知错误'}`)
    bagStore.applyTemplateCapture(definition.type, result)
    templatePreviewVersions.value = { ...templatePreviewVersions.value, [definition.type]: result.version || Date.now() }
    if (result.reloadError) ElMessage.warning(`${definition.shortLabel}模板已更新，但检测器重载失败：${result.reloadError}`)
    else ElMessage.success(result.reloaded ? `${definition.shortLabel}模板已更新，检测器已重载` : `${definition.shortLabel}模板已更新`)
  } catch (error) {
    ElMessage.error(`框选失败：${error.message}`)
  } finally {
    capturingType.value = ''
  }
}

function saveRegion(type) {
  bagStore.clearCaptureMetadata(type)
  bagStore.saveSettings()
}

function templateSizeText(definition) {
  const size = bagStore.templates[definition.capture]?.templateSize
  return size ? `${size.width} × ${size.height}px` : '未知'
}

function regionText(region) {
  return `${region.left}, ${region.top} → ${region.right}, ${region.bottom}`
}

function addBlacklistRule() {
  const keyword = draftRule.value.keyword.trim()
  if (!keyword) return ElMessage.warning('请输入黑名单关键词')
  bagStore.setBlacklist([...bagStore.blacklist, { field: draftRule.value.field, keyword }])
  draftRule.value.keyword = ''
}

function removeBlacklistRule(index) {
  bagStore.setBlacklist(bagStore.blacklist.filter((_rule, ruleIndex) => ruleIndex !== index))
}

async function handleStopStash() {
  try {
    await stopBagStash()
    ElMessage.info('已停止入库')
  } catch (error) {
    ElMessage.error(`停止入库失败：${error.message}`)
  }
}

function updateDebugOverlay() {
  if (!showDebugOverlay.value) return
  electronApi.window.updateDebugOverlay({ rectangles: [
    { ...bagStore.templates.stashRegion, label: '仓库标题区域', color: 'red' },
    { ...bagStore.templates.inventoryRegion, label: '背包标题区域', color: 'blue' }
  ] })
}

watch(showDebugOverlay, async (visible) => {
  if (visible) {
    await electronApi.window.openDebugOverlay()
    updateDebugOverlay()
  } else await electronApi.window.closeDebugOverlay()
})
watch(() => bagStore.templates, updateDebugOverlay, { deep: true })
onUnmounted(() => { if (showDebugOverlay.value) electronApi.window.closeDebugOverlay() })

function getTemplatePreview(imagePath, version = '') {
  if (!imagePath) return ''
  const url = imagePath.startsWith('file:') ? imagePath : `file:///${imagePath.replace(/\\/g, '/')}`
  return version ? `${url}?v=${encodeURIComponent(version)}` : url
}
</script>

<style scoped lang="less">
.bag-page { height: 100%; background: var(--bg-secondary); }
.bag-content { max-width: 1100px; margin: 0 auto; padding: 20px; }
.section-header { margin: 0 0 var(--spacing-sm) var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
.section-card { margin-bottom: var(--spacing-lg); box-shadow: none; border: 1px solid var(--border-base); }
.inline-hint { margin-left: 12px; }
.hint-text { margin-top: 6px; color: var(--text-secondary); font-size: 12px; }
.stats-row, .rule-editor, .region-inputs { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.rule-editor { margin-top: 16px; }
.rule-editor .el-input { flex: 1; min-width: 220px; }
.rule-table { margin-top: 16px; }
.template-form { margin-top: 16px; }
.template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.capture-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--border-base); border-radius: 8px; }
.capture-card__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.capture-card__body { height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--bg-secondary); border-radius: 6px; }
.template-meta { display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary); font-size: 12px; }
.advanced-settings { margin-top: 16px; }
.region-inputs .el-input-number { width: 130px; }
.upload-area { width: 260px; height: 100px; border: 1px dashed var(--border-base); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.upload-area:hover { border-color: var(--primary-color); }
.template-preview { width: 100%; height: 100%; object-fit: contain; }
.upload-placeholder { display: flex; gap: 8px; align-items: center; color: var(--text-secondary); }
@media (max-width: 800px) { .template-grid { grid-template-columns: 1fr; } }
</style>
