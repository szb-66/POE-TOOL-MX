<template>
  <el-drawer :model-value="modelValue" title="刷图设置" size="min(480px, 92vw)" @update:model-value="$emit('update:modelValue', $event)" @open="load">
    <div class="settings">
      <section>
        <h3>游戏日志</h3>
        <p>{{ logState }}</p>
        <p class="path">{{ store.clientStatus.logPath || '尚未定位 Client.txt' }}</p>
        <el-alert v-if="store.clientStatus.error" :title="store.clientStatus.error" type="error" :closable="false" />
        <div class="actions"><el-button :loading="logBusy" @click="prepareLog">自动检测</el-button><el-button :disabled="logBusy" @click="selectLog">选择日志文件</el-button></div>
      </section>
      <section>
        <h3>游戏内浮窗</h3>
        <el-switch :model-value="store.snapshot.settings.overlay?.enabled !== false" :disabled="store.busy" active-text="启用游戏内浮窗" @change="value => act(() => store.commitSettings({ overlay: { enabled: value } }))" />
        <p>游戏前台显示，拖动顶部抓手调整位置。</p>
        <el-button @click="act(() => electronApi.mapTracker.controlOverlay('reset'))">恢复默认位置</el-button>
      </section>
      <section>
        <h3>入库记录</h3>
        <el-switch :model-value="Boolean(store.snapshot.settings.enhancements?.loot)" :disabled="store.busy" active-text="记录入库物品" @change="value => act(() => store.setEnhancement('loot', value))" />
        <p>地图追踪开启且未暂停时，统计所有自动入库成功的物品，按堆叠数量累计，无需关联地图。</p>
      </section>
      <el-alert v-if="store.error || store.snapshot.errors?.length" :title="store.error || store.snapshot.errors.join('；')" type="error" :closable="false" />
    </div>
  </el-drawer>
</template>
<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import { useMapTrackerStore } from '@/stores/mapTracker.js'
defineProps({ modelValue: Boolean }); defineEmits(['update:modelValue'])
const store = useMapTrackerStore()
const logBusy = ref(false)
const logState = computed(() => ({ started: '日志监听中', resyncing: '日志重同步中', waiting: '等待日志文件', error: '日志读取失败', stopped: '日志监听未开启' }[store.clientStatus.state] || '等待日志'))
async function act(operation) { try { const result = await operation(); if (result?.success === false) throw new Error(result.error?.message || '操作失败') } catch (error) { ElMessage.error(error.message) } }
async function load() { await act(() => Promise.all([store.refresh(), store.refreshClient()])) }
async function prepareLog() { logBusy.value = true; try { await act(async () => { const result = await electronApi.clientEvents.updateSettings({ enabled: true, logPath: '' }); if (result?.success === false) throw new Error(result.error?.message); await store.refreshClient() }) } finally { logBusy.value = false } }
async function selectLog() { logBusy.value = true; try { await act(async () => { const result = await electronApi.clientEvents.selectLogFile(); if (result?.success === false) throw new Error(result.error?.message); await store.refreshClient() }) } finally { logBusy.value = false } }
</script>
<style scoped lang="less">
.settings{display:grid;gap:22px}section{border-top:1px solid var(--border-base);padding-top:10px}h3{font-size:15px}p{color:var(--text-secondary);font-size:12px;line-height:1.6}.path{overflow-wrap:anywhere}.actions{display:flex;gap:8px;margin-top:10px}
</style>
