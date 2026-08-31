import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/domains/settings/configTransfer/ConfigTransferCard.vue', import.meta.url), 'utf8')
const settingsView = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')

test('settings system tab mounts one full configuration transfer card without adding a tab', () => {
  assert.match(settingsView, /<ConfigTransferCard\s*\/>/)
  assert.match(settingsView, /import ConfigTransferCard from '\.\/configTransfer\/ConfigTransferCard\.vue'/)
  assert.equal((settingsView.match(/<el-tab-pane/g) || []).length, 7)
  const systemStart = settingsView.indexOf("activeTab === 'system'")
  const card = settingsView.indexOf('<ConfigTransferCard />')
  const nextPanel = settingsView.indexOf("activeTab === 'automation'", systemStart)
  assert.ok(systemStart >= 0 && card > systemStart && card < nextPanel)
})

test('export UI uses one outer card with five inner content cards and no group headings', () => {
  assert.match(component, /const exportSectionIds = ref\(\[\]\)/)
  assert.match(component, /class="transfer-content-card"/)
  assert.match(component, /v-for="section in exportCatalog"/)
  assert.match(component, /class="preset-details"/)
  assert.match(component, /v-model="exportPresetIds\[section\.id\]"/)
  const presetActionBlocks = [...component.matchAll(/<div class="preset-selection-actions">([\s\S]*?)<\/div>/g)]
    .map(match => match[1])
  assert.equal(presetActionBlocks.length, 2)
  for (const actions of presetActionBlocks) {
    assert.match(actions, /<el-button size="small".*?>全选<\/el-button>/)
    assert.match(actions, /<el-button size="small".*?>清空<\/el-button>/)
    assert.doesNotMatch(actions, /<el-button link/)
  }
  assert.match(component, /selectAllTransferContent/)
  assert.match(component, /clearExportSelection/)
  assert.doesNotMatch(component, /仅当前预设|selectCurrentExportPreset/)
  assert.match(component, /:disabled="!exportSectionIds\.length"/)
  assert.match(component, /exportIncludeDeviceGrid\['preset\.map'\] = false/)
  assert.doesNotMatch(component, /groupedExportCatalog|groupedImportCatalog|transfer-group__title|selectFullBackup|完整备份|确认导出本机环境|便携设置|本机环境/)
})

test('import UI defaults to compatible presets and tool sites while coordinates remain off', () => {
  assert.match(component, /section\.selectable && \(section\.group !== 'preset' \|\| section\.itemCount > 0\)/)
  assert.match(component, /importAcceptDeviceGrid\[section\.id\] = false/)
  assert.match(component, /importStep\.value = 'select'/)
  assert.match(component, /importStep\.value = 'confirm'/)
  assert.match(component, /确认并导入/)
  assert.match(component, /预计冲突/)
  assert.match(component, /来源版本/)
  assert.match(component, /:disabled="!section\.selectable"/)
  assert.match(component, /section\.status !== 'compatible'/)
  assert.match(component, /请只导入信任来源/)
  assert.doesNotMatch(component, /保持关闭|安全停止输入模块|候选运行配置/)
})

test('UI distinguishes cancellation, format, size, persistent validation and rollback outcomes', () => {
  assert.match(component, /if \(opened\.canceled\) return/)
  for (const code of [
    'INVALID_JSON', 'FILE_TOO_LARGE', 'CONFIG_FILE_ENCODING_INVALID', 'FUTURE_FORMAT_VERSION',
    'IMPORT_PREVALIDATION_FAILED', 'IMPORT_PERSIST_FAILED', 'IMPORT_ROLLBACK_INCOMPLETE'
  ]) {
    assert.match(component, new RegExp(code))
  }
  assert.doesNotMatch(component, /IMPORT_STOP_FAILED|IMPORT_PREPARE_FAILED|IMPORT_RUNTIME_FAILED/)
})
