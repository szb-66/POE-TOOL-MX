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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Edit } from '@element-plus/icons-vue'
import { usePresetStore } from '../../stores/preset'

const props = defineProps({
  type: {
    type: String,
    default: 'item', // 'item' or 'map'
    validator: (value) => ['item', 'map'].includes(value)
  }
})

const presetStore = usePresetStore()

const presets = computed(() => {
  return props.type === 'map' ? presetStore.mapPresets : presetStore.itemPresets
})

const currentPresetId = computed({
  get: () => props.type === 'map' ? presetStore.currentMapPresetId : presetStore.currentItemPresetId,
  set: (val) => {
    const success = props.type === 'map' 
      ? presetStore.switchMapPreset(val)
      : presetStore.switchItemPreset(val)
      
    if (success) {
      const preset = props.type === 'map' ? presetStore.currentMapPreset : presetStore.currentItemPreset
      ElMessage.success(`已切换到：${preset.name}`)
    }
  }
})

const currentPreset = computed(() => {
  return props.type === 'map' ? presetStore.currentMapPreset : presetStore.currentItemPreset
})

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
    const newPreset = props.type === 'map' 
      ? presetStore.addMapPreset(value)
      : presetStore.addItemPreset(value)
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
    
    if (props.type === 'map') {
      presetStore.updateCurrentMapPreset({ name: value })
    } else {
      presetStore.updateCurrentItemPreset({ name: value })
    }
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
    const success = props.type === 'map'
      ? presetStore.deleteMapPreset(currentPresetId.value)
      : presetStore.deleteItemPreset(currentPresetId.value)
      
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
}
</style>