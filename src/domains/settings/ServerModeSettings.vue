<template>
  <div class="section-header"><h3 class="section-title">游戏服务器</h3></div>
  <el-card class="section-card">
    <el-form label-width="120px" label-position="left">
      <el-form-item label="服务器模式">
        <el-select v-model="selected" :disabled="busy" aria-label="服务器模式">
          <el-option label="国服（简体中文客户端）" value="cn" />
          <el-option label="国际服（英文客户端）" value="international" />
        </el-select>
        <el-button :disabled="selected === currentServer.id || !desktop" :loading="busy" @click="switchMode">切换并重启</el-button>
      </el-form-item>
      <p>当前为{{ currentServer.label }}模式。切换会停止所有任务并重启；两服分别保存账号、赛季、预设和校准。</p>
      <template v-if="currentServer.id === 'international'">
        <el-alert title="英文功能已接入；制作、地图、存取、战斗与剧情的游戏操作须逐项完成开发版验收。切换服务器不会自动开始任务。" type="info" :closable="false" />
        <ul><li v-for="(status, key) in currentServer.capabilities" :key="key">{{ SERVER_FEATURES[key] }}：{{ capabilityLabel(status) }} · {{ status.reason }}</li></ul>
        <p>待实测功能可先设置英文坐标、标题模板和预设；验收模式下也需要手动开始任务。</p>
        <el-button :loading="probing" @click="probe">验证当前会话与接口</el-button>
        <p>先在下方完成网页登录或设置本地会话。验证只报告接口结构与状态，不保存账号、物品或凭据。</p>
        <ul v-if="report"><li v-for="entry in report" :key="entry.capability">{{ entry.label }}：{{ entry.state }}{{ entry.status ? `（HTTP ${entry.status}）` : '' }}</li></ul>
        <el-form-item label="英文物品解析">
          <el-input v-model="itemText" type="textarea" :rows="5" placeholder="粘贴英文客户端复制的物品文本，仅在本地解析" />
        </el-form-item>
        <el-button @click="parseText">解析物品文本</el-button>
        <pre v-if="parsed">{{ parsed }}</pre>
        <el-link href="https://www.pathofexile.com/trade" target="_blank" rel="noopener noreferrer">手动打开国际服交易站</el-link>
      </template>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { SERVER_FEATURES } from '../../../shared/serverMode.js'
import { currentServer } from '../../utils/serverContext.js'
import { parseItemInfo } from '../../../electron/modules/item/parser.js'

const desktop = Boolean(window.electronAPI)
const selected = ref(currentServer.id)
const busy = ref(false)
const probing = ref(false)
const report = ref(null)
const itemText = ref('')
const parsed = ref('')
function capabilityLabel(status) {
  if (status.state === 'verification') return '验收模式（待实测）'
  if (status.state === 'pending-client') return '已实现，待实测'
  return status.available ? '可用' : '未适配'
}
async function switchMode() {
  busy.value = true
  try {
    const result = await window.electronAPI.switchServerMode(selected.value)
    if (!result.success) throw new Error(result.error?.message || result.error)
  } catch (error) { ElMessage.error(error.message); busy.value = false }
}
async function probe() {
  probing.value = true
  try {
    const result = await window.electronAPI.probeServerCapabilities()
    if (!result.success) throw new Error(result.error?.message || result.error)
    report.value = result.data
  } catch (error) { ElMessage.error(error.message) }
  finally { probing.value = false }
}
function parseText() {
  if (!/^Item Class:/m.test(itemText.value) || !/^Rarity:/m.test(itemText.value)) return ElMessage.warning('请粘贴包含 Item Class 和 Rarity 的完整物品文本')
  parsed.value = JSON.stringify(parseItemInfo(itemText.value), null, 2)
}
</script>

<style scoped lang="less">
.el-select { width: 280px; margin-right: 12px; }
p, li { color: var(--text-secondary); font-size: 13px; }
pre { white-space: pre-wrap; max-height: 320px; overflow: auto; }
</style>
