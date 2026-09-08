<template>
  <div v-if="warning" class="feasibility-notice" aria-live="polite" aria-atomic="true">
    <el-alert type="error" :closable="false" show-icon :title="title">
      <p class="scope">按当前类别所有底子的理论上限检查，不含品质加成，仅提示，不影响洗图。</p>
      <p v-for="reason in result?.reasons || []" :key="reason">{{ reason }}</p>
      <p v-if="conditionText">当前条件：{{ conditionText }}</p>
      <p v-if="result.status === 'blacklist-impossible'">当前黑名单：{{ result.blacklist.join('、') }}</p>
      <p v-for="item in exceededBounds" :key="item.key">{{ STAT_LABELS[item.key] }}理论上界不超过 {{ item.upper }}%，要求至少 {{ item.value }}%。</p>
      <p class="scope">检查针对瓦尔前的洗练条件。</p>
      <p v-if="result?.snapshotDate" class="scope">词缀快照：{{ result.snapshotDate }} · POE {{ result.gameVersion }}</p>
    </el-alert>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { STAT_LABELS } from '../mapFeasibility.js'
import { createFeasibilityRunner } from '../mapFeasibilityRunner.js'

const props = defineProps({ profile: { type: Object, required: true }, targetKind: { type: String, required: true } })
const result = ref(null)
const warning = computed(() => ['blacklist-impossible', 'conditions-impossible'].includes(result.value?.status))
const title = computed(() => result.value?.status === 'blacklist-impossible' ? '黑名单导致当前条件无法洗出' : '当前条件超出理论可达范围')
const conditionText = computed(() => (result.value?.conditions || []).map(c => `${c.mode === 'optional' ? '挑选' : '必选'}${STAT_LABELS[c.key]} ≥ ${c.value}%`).join('；') + ((result.value?.conditions || []).some(c => c.mode === 'optional') ? `（挑选需满足 ${result.value.selectedCount} 项）` : ''))
const exceededBounds = computed(() => (result.value?.conditions || []).filter(c => Number.isFinite(result.value?.upperBounds?.[c.key]) && result.value.upperBounds[c.key] < c.value).map(c => ({ ...c, upper: result.value.upperBounds[c.key] })))
const runner = createFeasibilityRunner({
  createWorker: () => new Worker(new URL('../mapFeasibilityWorker.js', import.meta.url), { type: 'module' }),
  onPending: () => { result.value = null },
  onResult: value => { result.value = value }
})
watch(() => ({ kind: props.targetKind, profile: { match: props.profile.match, exalted: props.profile.exalted } }), input => runner.update(input), { deep: true, immediate: true })
onBeforeUnmount(() => runner.dispose())
</script>

<style scoped lang="less">
.feasibility-notice { margin-bottom: 16px; }
p { margin: 4px 0; overflow-wrap: anywhere; }
.scope { color: var(--text-secondary); font-size: 12px; }
</style>
