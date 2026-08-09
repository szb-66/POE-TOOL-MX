<template>
  <div class="preset-selector">
    <el-select
      v-model="currentPresetId"
      placeholder="选择预设"
      style="width: 200px"
      @change="handlePresetChange"
    >
      <el-option
        v-for="preset in presets"
        :key="preset.id"
        :label="preset.name"
        :value="preset.id"
      />
    </el-select>
    <el-button
      type="primary"
      :icon="Plus"
      @click="handleAddPreset"
      style="margin-left: 10px"
    >
      新建预设
    </el-button>
    <el-button
      v-if="currentPresetId !== 'default'"
      type="danger"
      :icon="Delete"
      @click="handleDeletePreset"
    >
      删除
    </el-button>
    <el-button
      type="info"
      :icon="Edit"
      @click="handleEditPresetName"
      style="margin-left: 10px"
    >
      重命名
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Delete, Edit } from '@element-plus/icons-vue'
import { usePresetStore } from '../../stores/preset'

const props = defineProps({
  type: {
    type: String,
    default: 'item',
    validator: (value) => ['item', 'map', 'chart', 'shop'].includes(value)
  }
})

const presetStore = usePresetStore()

const presetAccess = computed(() => ({
  item: {
    presets: presetStore.itemPresets,
    currentId: presetStore.currentItemPresetId,
    current: presetStore.currentItemPreset,
    add: presetStore.addItemPreset,
    remove: presetStore.deleteItemPreset,
    switchTo: presetStore.switchItemPreset,
    update: presetStore.updateCurrentItemPreset
  },
  map: {
    presets: presetStore.mapPresets,
    currentId: presetStore.currentMapPresetId,
    current: presetStore.currentMapPreset,
    add: presetStore.addMapPreset,
    remove: presetStore.deleteMapPreset,
    switchTo: presetStore.switchMapPreset,
    update: presetStore.updateCurrentMapPreset
  },
  chart: {
    presets: presetStore.chartPresets,
    currentId: presetStore.currentChartPresetId,
    current: presetStore.currentChartPreset,
    add: presetStore.addChartPreset,
    remove: presetStore.deleteChartPreset,
    switchTo: presetStore.switchChartPreset,
    update: presetStore.updateCurrentChartPreset
  },
  shop: {
    presets: presetStore.shopPresets,
    currentId: presetStore.currentShopPresetId,
    current: presetStore.currentShopPreset,
    add: presetStore.addShopPreset,
    remove: presetStore.deleteShopPreset,
    switchTo: presetStore.switchShopPreset,
    update: presetStore.updateCurrentShopPreset
  }
})[props.type])

const presets = computed(() => presetAccess.value.presets)

const currentPresetId = computed({
  get: () => presetAccess.value.currentId,
  set: (val) => {
    const success = presetAccess.value.switchTo(val)
      
    if (success) {
      ElMessage.success(`已切换到：${presetAccess.value.current.name}`)
    }
  }
})

const currentPreset = computed(() => presetAccess.value.current)

function handlePresetChange() {
  // 切换逻辑已通过 computed setter 处理
}

function handleAddPreset() {
  ElMessageBox.prompt('请输入预设名称', '新建预设', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '预设名称不能为空'
  }).then(({ value }) => {
    const newPreset = presetAccess.value.add(value)
    ElMessage.success(`预设"${newPreset.name}"创建成功`)
  }).catch(() => {})
}

function handleEditPresetName() {
  ElMessageBox.prompt('请输入新的预设名称', '重命名预设', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: currentPreset.value.name,
    inputPattern: /.+/,
    inputErrorMessage: '预设名称不能为空'
  }).then(({ value }) => {
    if (value === currentPreset.value.name) return
    
    presetAccess.value.update({ name: value })
    ElMessage.success(`预设已重命名为"${value}"`)
  }).catch(() => {})
}

function handleDeletePreset() {
  if (currentPresetId.value === 'default') {
    ElMessage.warning('不能删除默认预设')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除预设"${currentPreset.value.name}"吗？`,
    '删除预设',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const deletedName = currentPreset.value.name
    const success = presetAccess.value.remove(currentPresetId.value)
      
    if (success) {
      ElMessage.success(`预设"${deletedName}"已删除`)
    }
  }).catch(() => {})
}
</script>

<style scoped lang="less">
.preset-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  :deep(.el-button) {
    margin-left: 0 !important;
  }
}
</style>
