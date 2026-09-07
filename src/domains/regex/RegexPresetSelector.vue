<template>
  <div class="regex-preset-selector">
    <el-select v-model="currentId" placeholder="选择预设" class="preset-select">
      <el-option v-for="preset in presets" :key="preset.id" :label="preset.name" :value="preset.id" />
    </el-select>
    <el-button :icon="Plus" @click="addPreset">新建</el-button>
    <el-button :icon="Edit" @click="renamePreset">重命名</el-button>
    <el-button v-if="currentId !== 'default'" type="danger" plain :icon="Delete" @click="deletePreset">删除</el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import { useRegexPresetStore } from './regexPresetStore.js'

const props = defineProps({ kind: { type: String, required: true, validator: value => ['vendor', 'map', 'beast'].includes(value) } })
const store = useRegexPresetStore()
const isMap = computed(() => props.kind === 'map')
const presets = computed(() => props.kind === 'beast' ? store.beastRegexPresets : isMap.value ? store.mapRegexPresets : store.vendorPresets)
const current = computed(() => props.kind === 'beast' ? store.currentBeastRegexPreset : isMap.value ? store.currentMapRegexPreset : store.currentVendorPreset)
const currentId = computed({
  get: () => props.kind === 'beast' ? store.currentBeastRegexPresetId : isMap.value ? store.currentMapRegexPresetId : store.currentVendorPresetId,
  set: value => store.switchTo(props.kind, value)
})

function addPreset() {
  ElMessageBox.prompt('请输入预设名称', '新建正则预设', { confirmButtonText: '确定', cancelButtonText: '取消', inputPattern: /\S+/, inputErrorMessage: '预设名称不能为空' })
    .then(({ value }) => store.add(props.kind, value.trim())).catch(() => {})
}

function renamePreset() {
  ElMessageBox.prompt('请输入新的预设名称', '重命名正则预设', { confirmButtonText: '确定', cancelButtonText: '取消', inputValue: current.value.name, inputPattern: /\S+/, inputErrorMessage: '预设名称不能为空' })
    .then(({ value }) => store.update(props.kind, { name: value.trim() })).catch(() => {})
}

function deletePreset() {
  ElMessageBox.confirm(`确定删除预设“${current.value.name}”吗？`, '删除正则预设', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    .then(() => store.remove(props.kind, currentId.value)).catch(() => {})
}
</script>

<style scoped lang="less">
.regex-preset-selector { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.preset-select { width: 180px; }
</style>
