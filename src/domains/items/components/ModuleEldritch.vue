<template>
  <div class="module-eldritch">
    <div class="top-row">
      <el-checkbox v-model="form.enabled" @change="commit">启用焚界/灭界词缀制作</el-checkbox>
      <template v-if="form.enabled">
        <el-select v-model="form.source" class="source-select" @change="handleModeChange">
          <el-option label="焚界者模式" value="exarch" />
          <el-option label="灭界者模式" value="eater" />
        </el-select>
        <el-select v-model="form.tier" class="tier-select" @change="handleModeChange">
          <el-option v-for="option in tierOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </template>
    </div>

    <template v-if="form.enabled">
      <el-alert
        title="只能用于未腐化、兼容古灵隐式的头盔、手套、鞋子或胸甲；选择多个目标时命中任意一个即停止。"
        type="info"
        :closable="false"
        class="rule-tip"
      />
      <el-form label-width="100px" label-position="left">
        <el-form-item label="目标隐式">
          <el-select
            v-model="form.targets"
            multiple
            filterable
            remote
            value-key="familyId"
            reserve-keyword
            :remote-method="searchTargets"
            :loading="loading"
            placeholder="搜索并选择一个或多个古灵隐式"
            class="target-select"
            popper-class="eldritch-target-popper"
            @visible-change="handleVisibleChange"
            @change="commit"
          >
            <el-option v-for="option in options" :key="option.familyId" :label="option.displayName" :value="option">
              <div class="eldritch-option">
                <b>{{ option.displayName }}</b>
                <span>{{ option.exampleText }}</span>
                <small>{{ option.applicableLabel }}</small>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { electronApi } from '../../../api/electron.js'
import { usePresetStore } from '../../../stores/preset.js'
import { normalizeEldritchModule } from '../eldritchConfig.js'

const presetStore = usePresetStore()
const moduleEldritch = computed(() => presetStore.currentItemPreset.moduleEldritch)
const form = ref(normalizeEldritchModule(moduleEldritch.value))
const options = ref([...form.value.targets])
const loading = ref(false)
const tierOptions = [
  { value: 1, label: 'T1 · 次级' },
  { value: 2, label: 'T2 · 高级' },
  { value: 3, label: 'T3 · 上级' },
  { value: 4, label: 'T4 · 卓越' }
]

watch(moduleEldritch, (value) => {
  form.value = normalizeEldritchModule(value)
  options.value = mergeOptions(options.value, form.value.targets)
}, { deep: true })

function mergeOptions(left, right) {
  return [...new Map([...left, ...right].map((entry) => [entry.familyId, entry])).values()]
}

function commit() {
  form.value = normalizeEldritchModule(form.value)
  presetStore.updateCurrentItemPreset({ moduleEldritch: form.value })
}

async function searchTargets(query = '') {
  loading.value = true
  try {
    const result = await electronApi.crafting.searchEldritchImplicitSuggestions({
      query,
      source: form.value.source,
      tier: form.value.tier,
      limit: 100
    })
    options.value = mergeOptions(form.value.targets, result?.items ?? [])
  } catch {
    options.value = [...form.value.targets]
  } finally {
    loading.value = false
  }
}

function handleVisibleChange(visible) {
  if (visible && options.value.length === form.value.targets.length) void searchTargets('')
}

function handleModeChange() {
  form.value.targets = []
  options.value = []
  commit()
  void searchTargets('')
}
</script>

<style scoped lang="less">
.module-eldritch { width: 100%; }
.top-row { display: flex; align-items: center; flex-wrap: wrap; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
.source-select { width: 150px; }
.tier-select { width: 135px; }
.rule-tip { margin-bottom: var(--spacing-md); }
.target-select { width: min(760px, 100%); }
:global(.eldritch-target-popper .el-select-dropdown__item) { height: auto; min-height: 72px; padding: 8px 14px; line-height: 1.4; }
:global(.eldritch-target-popper .eldritch-option) { display: grid; gap: 3px; white-space: normal; }
:global(.eldritch-target-popper .eldritch-option span) { color: var(--text-primary); }
:global(.eldritch-target-popper .eldritch-option small) { color: var(--text-secondary); }
</style>
