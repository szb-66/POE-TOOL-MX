<template>
  <div class="config-transfer-card">
    <div class="config-transfer-card__copy">
      <strong>配置导入与导出</strong>
      <span>按区块或单个预设生成本地 JSON 文件，便于备份或与其他玩家分享。</span>
    </div>
    <div class="config-transfer-card__actions">
      <el-button :icon="Download" @click="openExportDialog">导出配置</el-button>
      <el-button type="primary" :icon="Upload" :loading="openingImport" @click="chooseImportFile">导入配置</el-button>
    </div>
    <el-alert
      class="config-transfer-card__notice"
      title="不会导出账号 Cookie、会话、缓存、日志、训练数据、本地路径、背景或识别模板文件。"
      type="info"
      :closable="false"
      show-icon
    />

    <el-dialog v-model="exportVisible" title="导出配置" width="min(920px, 92vw)" destroy-on-close>
      <div class="transfer-quick-actions">
        <el-button @click="selectAllTransferContent">全部选择</el-button>
        <el-button @click="clearExportSelection">清空</el-button>
        <span class="transfer-selection-count">已选 {{ exportSectionIds.length }} 类内容</span>
      </div>

      <div class="transfer-content-card">
        <div
          v-for="section in exportCatalog"
          :key="section.id"
          class="transfer-section"
          :class="{ 'is-selected': exportSectionIds.includes(section.id) }"
        >
          <el-checkbox
            :model-value="exportSectionIds.includes(section.id)"
            @change="checked => setExportSectionSelected(section.id, checked)"
          >
            <span class="transfer-section__label">{{ section.label }}</span>
          </el-checkbox>
          <template v-if="section.group === 'preset' && exportSectionIds.includes(section.id)">
            <div class="preset-details">
              <div class="preset-selection-actions">
                <el-button size="small" @click="selectAllExportPresets(section)">全选</el-button>
                <el-button size="small" @click="exportPresetIds[section.id] = []">清空</el-button>
              </div>
              <el-checkbox-group v-model="exportPresetIds[section.id]" class="preset-checks">
                <el-checkbox v-for="preset in section.presets" :key="preset.id" :value="preset.id">
                  {{ preset.name }}<el-tag v-if="preset.active" size="small" type="success">当前</el-tag>
                </el-checkbox>
              </el-checkbox-group>
              <el-checkbox
                v-if="section.supportsDeviceGrid"
                v-model="exportIncludeDeviceGrid[section.id]"
                class="device-grid-option"
              >包含本机坐标</el-checkbox>
            </div>
          </template>
        </div>
      </div>

      <el-alert
        v-if="selectedExportHasGrid"
        title="已选择导出地图本机网格坐标，接收方仍需在导入时单独同意接收。"
        type="warning"
        :closable="false"
        show-icon
      />
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" :loading="exporting" :disabled="!exportSectionIds.length" @click="handleExport">选择保存位置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importVisible" title="导入配置" width="min(960px, 94vw)" destroy-on-close>
      <template v-if="openedImport">
        <div class="import-source-summary">
          <div><span>文件</span><strong>{{ openedImport.fileName }}</strong></div>
          <div><span>来源版本</span><strong>v{{ openedImport.parsed.bundle.appVersion || '未知' }}</strong></div>
          <div><span>导出时间</span><strong>{{ formatDate(openedImport.parsed.bundle.exportedAt) }}</strong></div>
          <div><span>格式</span><strong>v{{ openedImport.parsed.bundle.formatVersion }}</strong></div>
          <div><span>区块</span><strong>{{ importCatalog.length }}</strong></div>
          <div><span>预设</span><strong>{{ importPresetCount }}</strong></div>
        </div>

        <template v-if="importStep === 'select'">
          <el-alert
            title="默认选择兼容的预设和工具站点；来源文件中的地图坐标仍需要你主动勾选。"
            type="info"
            :closable="false"
            show-icon
          />
          <el-alert
            title="配置文件是本地明文 JSON，请只导入信任来源；账号会话、本地路径、背景和识别模板不会被导入。"
            type="warning"
            :closable="false"
            show-icon
          />
          <div class="transfer-content-card">
            <div
              v-for="section in importCatalog"
              :key="section.id"
              class="transfer-section"
              :class="{ 'is-disabled': !section.selectable, 'is-selected': importSectionIds.includes(section.id) }"
            >
              <el-checkbox
                :model-value="importSectionIds.includes(section.id)"
                :disabled="!section.selectable"
                @change="checked => setImportSectionSelected(section.id, checked)"
              >
                <span class="transfer-section__label">{{ section.label || section.id }}</span>
                <el-tag v-if="section.status !== 'compatible'" size="small" type="info">{{ section.reason }}</el-tag>
                <el-tag v-else-if="section.itemCount" size="small">{{ section.itemCount }} 项</el-tag>
              </el-checkbox>
              <template v-if="section.group === 'preset' && section.selectable && importSectionIds.includes(section.id)">
                <div class="preset-details">
                  <div class="preset-selection-actions">
                    <el-button size="small" @click="importRecordKeys[section.id] = section.items.map(item => item.recordKey)">全选</el-button>
                    <el-button size="small" @click="importRecordKeys[section.id] = []">清空</el-button>
                  </div>
                  <el-checkbox-group v-model="importRecordKeys[section.id]" class="preset-checks">
                    <el-checkbox v-for="item in section.items" :key="item.recordKey" :value="item.recordKey">
                      {{ item.name }}
                      <el-tag v-if="item.hasDeviceGrid" size="small" type="warning">含本机坐标</el-tag>
                    </el-checkbox>
                  </el-checkbox-group>
                  <el-checkbox
                    v-if="section.items.some(item => item.hasDeviceGrid)"
                    v-model="importAcceptDeviceGrid[section.id]"
                    class="device-grid-option"
                  >接收该区块的本机坐标</el-checkbox>
                </div>
              </template>
            </div>
          </div>
        </template>

        <template v-else-if="importStep === 'confirm' && importPreview">
          <el-result icon="warning" title="请确认本次导入" sub-title="应用后不会自动切换当前预设或页面，也不会启动任何任务。" />
          <div class="preview-metrics">
            <div><strong>{{ importPreview.selectedSectionIds.length }}</strong><span>区块</span></div>
            <div><strong>{{ importPreview.presetCount }}</strong><span>新预设</span></div>
            <div><strong>{{ importPreview.conflicts }}</strong><span>预计冲突</span></div>
          </div>
          <el-alert
            v-for="warning in importPreview.warnings"
            :key="`${warning.sectionId}:${warning.message}`"
            :title="warning.message"
            type="warning"
            :closable="false"
            show-icon
          />
          <div class="preview-sections">
            <div v-for="plan in importPreview.plans" :key="plan.id">
              <div>
                <strong>{{ plan.definition?.label || plan.id }}</strong>
                <small v-if="plan.names?.length">将新增：{{ plan.names.join('、') }}</small>
              </div>
              <span>新增 {{ plan.summary?.added || 0 }}、跳过 {{ plan.summary?.skipped || 0 }}、冲突 {{ plan.summary?.conflicts || 0 }}</span>
            </div>
          </div>
        </template>

        <template v-else-if="importStep === 'running'">
          <div class="transfer-running">
            <el-icon class="is-loading"><Loading /></el-icon>
            <strong>{{ progressText }}</strong>
            <el-progress :percentage="progressPercentage" />
          </div>
        </template>

        <template v-else-if="importStep === 'result' && importResult">
          <el-result icon="success" title="配置导入完成" sub-title="已新增所选预设并合并工具站点，当前预设和运行状态保持不变。" />
          <div class="result-sections">
            <div v-for="section in importResult.sections" :key="section.id">
              <strong>{{ sectionLabel(section.id) }}</strong>
              <span>新增 {{ section.added }}、跳过 {{ section.skipped }}、冲突 {{ section.conflicts }}</span>
            </div>
          </div>
        </template>
      </template>

      <template #footer>
        <template v-if="importStep === 'select'">
          <el-button @click="importVisible = false">取消</el-button>
          <el-button type="primary" @click="buildPreview">预览导入</el-button>
        </template>
        <template v-else-if="importStep === 'confirm'">
          <el-button @click="importStep = 'select'">返回修改</el-button>
          <el-button type="danger" @click="confirmImport">确认并导入</el-button>
        </template>
        <el-button v-else-if="importStep === 'result'" type="primary" @click="importVisible = false">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Download, Loading, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { usePresetStore } from '@/stores/preset'
import { useStoryStore } from '@/stores/story'
import { createConfigTransferService } from './service.js'
import packageConfig from '../../../../package.json'

const context = {
  presetStore: usePresetStore(),
  storyStore: useStoryStore(),
  electronApi,
  storage: globalThis.localStorage
}
const transfer = createConfigTransferService({
  context,
  appVersion: packageConfig.version
})

const exportVisible = ref(false)
const exporting = ref(false)
const exportSectionIds = ref([])
const exportPresetIds = reactive({})
const exportIncludeDeviceGrid = reactive({})
const exportCatalog = ref(transfer.exportCatalog())

const importVisible = ref(false)
const openingImport = ref(false)
const openedImport = ref(null)
const importCatalog = ref([])
const importSectionIds = ref([])
const importRecordKeys = reactive({})
const importAcceptDeviceGrid = reactive({})
const importStep = ref('select')
const importPreview = ref(null)
const importResult = ref(null)
const progress = ref({ stage: '', completed: 0, total: 1 })

const importPresetCount = computed(() => importCatalog.value.reduce((total, section) => total + Number(section.itemCount || 0), 0))
const selectedExportHasGrid = computed(() =>
  exportSectionIds.value.includes('preset.map') && exportIncludeDeviceGrid['preset.map']
)
const progressPercentage = computed(() => Math.round(100 * Math.min(progress.value.completed, progress.value.total) / Math.max(1, progress.value.total)))
const progressText = computed(() => ({
  validate: '正在校验并快照本地配置…',
  persist: '正在保存已选区块…',
  rollback: '导入失败，正在恢复原配置…'
})[progress.value.stage] || '正在准备导入…')

function resetExportSelection() {
  exportSectionIds.value = []
  for (const section of exportCatalog.value) {
    exportPresetIds[section.id] = []
    exportIncludeDeviceGrid[section.id] = false
  }
}

function openExportDialog() {
  exportCatalog.value = transfer.exportCatalog()
  resetExportSelection()
  exportVisible.value = true
}

function selectAllExportPresets(section) {
  exportPresetIds[section.id] = section.presets.map(preset => preset.id)
}

function selectAllTransferContent() {
  exportSectionIds.value = exportCatalog.value
    .filter(section => section.group !== 'preset' || section.presets.length)
    .map(section => section.id)
  for (const section of exportCatalog.value.filter(item => item.group === 'preset')) selectAllExportPresets(section)
  exportIncludeDeviceGrid['preset.map'] = false
}

function clearExportSelection() {
  resetExportSelection()
}

function setSectionSelected(sectionIds, sectionId, checked) {
  if (checked) {
    if (!sectionIds.value.includes(sectionId)) sectionIds.value = [...sectionIds.value, sectionId]
    return
  }
  sectionIds.value = sectionIds.value.filter(id => id !== sectionId)
}

function setExportSectionSelected(sectionId, checked) {
  setSectionSelected(exportSectionIds, sectionId, checked)
}

function setImportSectionSelected(sectionId, checked) {
  setSectionSelected(importSectionIds, sectionId, checked)
}

function validatePresetSelections(sectionIds, presetSelections) {
  const empty = exportCatalog.value.find(section =>
    section.group === 'preset' && sectionIds.includes(section.id) && !(presetSelections[section.id]?.length)
  )
  if (empty) throw new Error(`请至少选择一个${empty.label}`)
}

async function handleExport() {
  try {
    validatePresetSelections(exportSectionIds.value, exportPresetIds)
    exporting.value = true
    const bySection = Object.fromEntries(exportSectionIds.value.map(sectionId => [sectionId, {
      selectedPresetIds: exportPresetIds[sectionId],
      includeDeviceGrid: exportIncludeDeviceGrid[sectionId] === true
    }]))
    const result = await transfer.exportToFile({ selectedSectionIds: exportSectionIds.value, bySection })
    if (!result.canceled) {
      exportVisible.value = false
      ElMessage.success(`配置已导出：${result.fileName}`)
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(transferErrorMessage(error))
  } finally {
    exporting.value = false
  }
}

async function chooseImportFile() {
  openingImport.value = true
  try {
    const opened = await transfer.openImportFile()
    if (opened.canceled) return
    openedImport.value = opened
    importCatalog.value = transfer.importCatalog(opened)
    importSectionIds.value = importCatalog.value
      .filter(section => section.selectable && (section.group !== 'preset' || section.itemCount > 0))
      .map(section => section.id)
    for (const section of importCatalog.value) {
      importRecordKeys[section.id] = importSectionIds.value.includes(section.id)
        ? section.items.map(item => item.recordKey)
        : []
      importAcceptDeviceGrid[section.id] = false
    }
    importPreview.value = null
    importResult.value = null
    importStep.value = 'select'
    importVisible.value = true
  } catch (error) {
    ElMessage.error(transferErrorMessage(error))
  } finally {
    openingImport.value = false
  }
}

function importOptions() {
  return {
    selectedSectionIds: importSectionIds.value,
    bySection: Object.fromEntries(importSectionIds.value.map(sectionId => [sectionId, {
      selectedRecordKeys: importRecordKeys[sectionId],
      acceptDeviceGrid: importAcceptDeviceGrid[sectionId] === true
    }]))
  }
}

function buildPreview() {
  try {
    if (!importSectionIds.value.length) throw new Error('请至少选择一个导入区块')
    const emptyPreset = importCatalog.value.find(section =>
      section.group === 'preset' && importSectionIds.value.includes(section.id) && !(importRecordKeys[section.id]?.length)
    )
    if (emptyPreset) throw new Error(`请至少选择一个${emptyPreset.label}`)
    importPreview.value = transfer.previewImport(openedImport.value, importOptions())
    importStep.value = 'confirm'
  } catch (error) {
    ElMessage.error(transferErrorMessage(error))
  }
}

async function confirmImport() {
  importStep.value = 'running'
  progress.value = { stage: 'validate', completed: 0, total: 1 }
  try {
    importResult.value = await transfer.executeImport(importPreview.value, {
      onProgress: value => { progress.value = value }
    })
    importStep.value = 'result'
  } catch (error) {
    importStep.value = 'confirm'
    ElMessage.error(transferErrorMessage(error))
  }
}

function sectionLabel(sectionId) {
  return importCatalog.value.find(section => section.id === sectionId)?.label || sectionId
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '未知' : date.toLocaleString('zh-CN')
}

function transferErrorMessage(error) {
  const messages = {
    INVALID_JSON: '文件不是有效的 JSON 配置。',
    INVALID_KIND: '选择的文件不是流放助手配置。',
    FILE_TOO_LARGE: '配置文件超过 5 MiB 限制。',
    CONFIG_FILE_TOO_LARGE: '配置文件超过 5 MiB 限制。',
    CONFIG_FILE_ENCODING_INVALID: '配置文件必须使用 UTF-8 编码。',
    FUTURE_FORMAT_VERSION: '该文件由更高版本的流放助手生成，当前版本无法导入。',
    IMPORT_PREVALIDATION_FAILED: '导入内容校验失败，本次未写入任何数据。',
    IMPORT_PERSIST_FAILED: '配置保存失败，已恢复原配置。',
    IMPORT_ROLLBACK_INCOMPLETE: '导入失败且回滚不完整，请重启应用后检查本地预设和工具站点。',
    IMPORT_BUSY: '已有配置导入任务正在执行。'
  }
  return messages[error?.code] || error?.message || '配置操作失败'
}
</script>

<style scoped lang="less">
.config-transfer-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px 24px;
  align-items: center;
}

.config-transfer-card__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong { font-size: 15px; color: var(--app-text-primary); }
  span { color: var(--app-text-secondary); line-height: 1.6; }
}

.config-transfer-card__actions { display: flex; gap: 10px; }
.config-transfer-card__notice { grid-column: 1 / -1; }

.transfer-quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.transfer-selection-count { margin-left: auto; color: var(--app-text-secondary); }
.transfer-content-card {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.transfer-section {
  padding: 11px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.transfer-section.is-disabled { opacity: 0.66; }
.transfer-section.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
}
.transfer-section__label { margin-right: 8px; }
.preset-details {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}
.preset-selection-actions { margin-bottom: 6px; }
.preset-checks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 12px; }
.preset-checks :deep(.el-checkbox) { margin-right: 0; min-width: 0; }
.preset-checks :deep(.el-checkbox__label) { overflow: hidden; text-overflow: ellipsis; }
.device-grid-option { margin-top: 8px; color: var(--el-color-warning); }

.import-source-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin-bottom: 14px;

  div { padding: 10px; border-radius: 8px; background: var(--el-fill-color-extra-light); }
  span, strong { display: block; }
  span { margin-bottom: 4px; color: var(--app-text-secondary); font-size: 12px; }
  strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;

  div { text-align: center; padding: 12px; border-radius: 8px; background: var(--el-fill-color-extra-light); }
  strong { display: block; font-size: 22px; }
  span { color: var(--app-text-secondary); }
}

.preview-sections, .result-sections {
  margin-top: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;

  div { display: flex; justify-content: space-between; gap: 16px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color); }
  div:last-child { border-bottom: 0; }
  div > div { display: block; padding: 0; border: 0; }
  small { display: block; margin-top: 3px; color: var(--app-text-secondary); }
  span { color: var(--app-text-secondary); text-align: right; }
}

.transfer-running { padding: 64px 24px; text-align: center; }
.transfer-running .el-icon { display: block; margin: 0 auto 14px; font-size: 36px; color: var(--el-color-primary); }
.transfer-running strong { display: block; margin-bottom: 18px; }

@media (max-width: 720px) {
  .config-transfer-card { grid-template-columns: 1fr; }
  .config-transfer-card__actions { justify-content: flex-start; }
  .config-transfer-card__notice { grid-column: 1; }
  .preset-checks, .import-source-summary { grid-template-columns: 1fr; }
}
</style>
