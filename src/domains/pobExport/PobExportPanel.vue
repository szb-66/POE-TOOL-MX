<template>
  <section class="export-panel">
    <header>
      <div><h2>{{ source === 'self' ? '我的角色' : '他人角色' }}</h2><p>{{ source === 'self' ? '使用助手当前登录的国服账号' : '输入国服论坛 ID，仅能访问官网公开的角色' }}</p></div>
      <el-tag v-if="source === 'self'" :type="authenticated ? 'success' : 'info'">{{ authenticated ? '已登录' : '未登录' }}</el-tag>
    </header>
    <el-form label-position="top" @submit.prevent="controller.load()">
      <div class="account-row">
        <el-form-item v-if="source === 'other'" label="论坛 ID">
          <el-input :model-value="state.forumId" maxlength="200" placeholder="输入官网个人资料中的论坛 ID" clearable @update:model-value="controller.setForumId" />
        </el-form-item>
        <el-button :loading="state.busy === 'load'" :disabled="!canLoad || Boolean(state.busy)" @click="controller.load()">{{ state.loaded ? '刷新角色' : '加载角色' }}</el-button>
        <el-button v-if="source === 'self'" plain @click="$router.push(settingsRoute('general'))">{{ authenticated ? '账号设置' : '前往登录' }}</el-button>
      </div>
      <div class="selection-row">
        <el-form-item label="选择赛季">
          <el-select :model-value="state.league" filterable :disabled="!state.characters.length" placeholder="加载角色后选择赛季" @update:model-value="controller.setLeague">
            <el-option v-for="league in leagues" :key="league" :label="league" :value="league" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择角色">
          <el-select :model-value="state.character" filterable :disabled="!state.league" placeholder="选择要导出的角色" @update:model-value="controller.setCharacter">
            <el-option v-for="character in characters" :key="character.name" :label="`${character.name} · Lv.${character.level} ${character.class}`" :value="character.name" />
          </el-select>
        </el-form-item>
      </div>
      <p v-if="state.loaded && !state.characters.length" class="hint">该账号没有可导出的国服 PoE 1 角色。</p>
      <el-alert v-if="state.error" :title="state.error" type="error" :closable="false" show-icon />
      <div class="export-row">
        <el-button type="primary" :loading="state.busy === 'export'" :disabled="!state.character || Boolean(state.busy) || !canLoad" @click="controller.exportBuild()">导出 PoB</el-button>
        <span v-if="state.busy === 'export'" class="hint">正在获取角色并转换构筑…</span>
      </div>
      <template v-if="state.result">
        <el-form-item label="PoB 导入码"><el-input :model-value="state.result.code" type="textarea" :rows="3" readonly aria-label="PoB 导入码" /></el-form-item>
        <div class="result-row"><el-button :loading="copying" @click="copyCode">复制导入码</el-button><span class="hint">生成于 {{ new Date(state.result.generatedAt).toLocaleString('zh-CN') }}</span></div>
      </template>
      <el-alert v-if="state.warnings.length" class="warnings" :title="state.result ? '导入后需要核对' : '需要核对的数据'" type="warning" :closable="false" show-icon>
        <ul><li v-for="warning in state.warnings" :key="warning">{{ warning }}</li></ul>
      </el-alert>
    </el-form>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import { settingsRoute } from '@/router/settingsNavigation'
import { newExportState, createExportController } from './exportState.js'

const props = defineProps({ source: { type: String, required: true }, authenticated: Boolean, accountName: { type: String, default: '' }, preferredLeague: { type: String, default: '' } })
const state = reactive(newExportState())
const controller = createExportController(state, { api: electronApi.pobExport, source: props.source, preferredLeague: () => props.preferredLeague })
const canLoad = computed(() => props.source === 'self' ? props.authenticated : Boolean(state.forumId.trim()))
const leagues = computed(() => [...new Set(state.characters.map(c => c.league))])
const characters = computed(() => state.characters.filter(c => c.league === state.league))
const copying = ref(false)
watch(() => [props.authenticated, props.accountName], () => controller.invalidate(true), { flush: 'sync' })
onBeforeUnmount(controller.dispose)
async function copyCode() {
  if (!state.result?.code || copying.value) return
  copying.value = true
  try {
    const result = await electronApi.clipboard.writeText(state.result.code)
    if (result?.success === false) throw new Error('复制失败，请手动选中导入码复制')
    ElMessage.success('PoB 导入码已复制')
  } catch { ElMessage.error('复制失败，请手动选中导入码复制') }
  finally { copying.value = false }
}
</script>

<style scoped lang="less">
.export-panel { padding: 22px; border: 1px solid var(--border-base); border-radius: 10px; background: var(--bg-primary); }
header, .account-row, .export-row, .result-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
header { justify-content: space-between; margin-bottom: 20px; }
h2 { margin: 0 0 6px; font-size: 17px; }
p, .hint { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
.account-row { margin-bottom: 20px; align-items: flex-end; }
.account-row .el-form-item { flex: 1; min-width: 220px; margin: 0; }
.account-row .el-button + .el-button { margin-left: 0; }
.selection-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.el-select { width: 100%; }
.export-row { margin: 4px 0 18px; }
.warnings { margin-top: 18px; }
ul { margin: 6px 0; padding-left: 18px; max-height: 220px; overflow: auto; overflow-wrap: anywhere; }
@media (max-width: 760px) { .selection-row { grid-template-columns: 1fr; gap: 0; } }
</style>
