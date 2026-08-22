<template>
  <div class="shop-page primary-page primary-page--column">
    <div class="primary-page__tabs">
      <el-tabs v-model="activeTool" class="shop-tabs">
        <el-tab-pane label="商城配方" name="chaos" />
        <el-tab-pane label="商城正则" name="vendor" />
      </el-tabs>
    </div>
    <div class="shop-content primary-page__scroll primary-page__content">
      <template v-if="activeTool === 'vendor'">
    <div class="page-heading">
      <div>
        <h2>商城 Vendor 正则</h2>
        <p>勾选需要高亮的商人物品条件，再将生成结果复制到游戏商城搜索框。</p>
      </div>
      <div class="preset-actions">
        <PresetSelector type="shop" />
        <el-button :icon="RefreshLeft" @click="resetCurrentPreset">重置条件</el-button>
      </div>
    </div>

    <el-row class="content-grid app-grid" :gutter="16">
      <el-col :xs="24" :md="16" class="filter-column">
        <el-card class="filter-card">
          <template #header><span>插槽与连接</span></template>

          <FilterGroup title="三连孔色">
            <el-checkbox-group v-model="vendor.threeLinks" class="option-grid socket-grid">
              <el-checkbox v-for="item in groups.threeLinks" :key="item.id" :value="item.id">
                <span class="socket-preview">{{ item.preview }}</span>{{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </FilterGroup>

          <FilterGroup title="二连孔色">
            <el-checkbox-group v-model="vendor.twoLinks" class="option-grid socket-grid">
              <el-checkbox v-for="item in groups.twoLinks" :key="item.id" :value="item.id">
                <span class="socket-preview">{{ item.preview }}</span>{{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </FilterGroup>

          <FilterGroup title="通用连接">
            <el-checkbox-group v-model="vendor.anyLinks" class="option-grid">
              <el-checkbox v-for="item in groups.anyLinks" :key="item.id" :value="item.id">
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </FilterGroup>

          <FilterGroup title="指定连接颜色数量">
            <div class="exact-colors">
              <el-checkbox v-model="vendor.exactColors.enabled">启用</el-checkbox>
              <label>红 <el-input-number v-model="vendor.exactColors.red" :min="0" :max="6" size="small" /></label>
              <label>绿 <el-input-number v-model="vendor.exactColors.green" :min="0" :max="6" size="small" /></label>
              <label>蓝 <el-input-number v-model="vendor.exactColors.blue" :min="0" :max="6" size="small" /></label>
            </div>
          </FilterGroup>
        </el-card>

        <el-card class="filter-card">
          <template #header><span>装备词条</span></template>
          <FilterGroup title="移动速度">
            <el-checkbox-group v-model="vendor.movement" class="option-grid">
              <el-checkbox v-for="item in groups.movement" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
            </el-checkbox-group>
          </FilterGroup>
          <FilterGroup title="+1 法术技能石等级">
            <el-checkbox-group v-model="vendor.plusGems" class="option-grid">
              <el-checkbox v-for="item in groups.plusGems" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
            </el-checkbox-group>
          </FilterGroup>
          <FilterGroup title="伤害词条">
            <el-checkbox-group v-model="vendor.damage" class="option-grid">
              <el-checkbox v-for="item in groups.damage" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
            </el-checkbox-group>
          </FilterGroup>
        </el-card>

        <el-card class="filter-card">
          <template #header><span>武器与盾牌基底</span></template>
          <el-checkbox-group v-model="vendor.weaponTypes" class="option-grid weapon-grid">
            <el-checkbox v-for="item in groups.weaponTypes" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8" tag="aside" class="result-column">
        <el-card class="result-card">
          <template #header>
            <div class="result-header">
              <span>生成结果</span>
              <el-tag :type="result.overLimit ? 'danger' : 'info'">{{ result.length }} / 50</el-tag>
            </div>
          </template>

          <el-input
            :model-value="result.regex"
            type="textarea"
            :rows="6"
            readonly
            resize="none"
            placeholder="选择条件后将在这里生成正则"
          />

          <div v-if="result.warnings.length" class="warning-list">
            <el-alert
              v-for="warning in result.warnings"
              :key="warning"
              :title="warning"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>

          <el-button
            type="primary"
            :icon="CopyDocument"
            :disabled="!result.regex"
            class="copy-button"
            @click="copyRegex"
          >
            复制正则
          </el-button>
        </el-card>

        <el-card class="about-card">
          <template #header><span>说明</span></template>
          <p>数据：{{ meta.gameVersion }} · {{ meta.updatedAt }}</p>
          <p>本功能为离线、非官方工具，不会自动修改剪贴板，也不会向游戏发送按键。</p>
          <p>
            功能参考
            <a href="https://poe.re/#/" target="_blank" rel="noreferrer">poe.re</a>
            与
            <a href="https://github.com/veiset/poe-vendor-string" target="_blank" rel="noreferrer">veiset/poe-vendor-string</a>。
          </p>
        </el-card>
      </el-col>
    </el-row>
      </template>
      <ChaosRecipePanel v-else />
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { CopyDocument, RefreshLeft } from '@element-plus/icons-vue'
import PresetSelector from '../../components/common/PresetSelector.vue'
import { electronApi } from '../../api/electron.js'
import { usePresetStore } from '../../stores/preset.js'
import { createDefaultVendorConfig } from './vendorConfig.js'
import { VENDOR_DATA_META, VENDOR_OPTION_GROUPS } from './vendorData.js'
import { generateVendorRegex } from './vendorRegex.js'
import ChaosRecipePanel from './ChaosRecipePanel.vue'
import { readPersistentTab, writePersistentTab } from '@/utils/tabPersistence'

const FilterGroup = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'filter-group' }, [
      h('h3', props.title),
      slots.default?.()
    ])
  }
})

const presetStore = usePresetStore()
const SHOP_TABS = ['chaos', 'vendor']
const activeTool = ref(readPersistentTab('shopActiveTool', SHOP_TABS, 'chaos'))
const groups = VENDOR_OPTION_GROUPS
const meta = VENDOR_DATA_META
const vendor = computed(() => presetStore.currentShopPreset.vendor)
const result = computed(() => generateVendorRegex(vendor.value))

let saveTimer = null
watch(vendor, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => presetStore.savePresets(), 300)
}, { deep: true })
watch(activeTool, (value) => { activeTool.value = writePersistentTab('shopActiveTool', value, SHOP_TABS, 'chaos') })

async function resetCurrentPreset() {
  try {
    await ElMessageBox.confirm('确定清空当前商城预设的全部条件吗？', '重置条件', {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning'
    })
    presetStore.updateCurrentShopPreset({ vendor: createDefaultVendorConfig() })
    ElMessage.success('当前条件已重置')
  } catch {
    // 用户取消
  }
}

async function copyRegex() {
  if (!result.value.regex) return
  try {
    await electronApi.clipboard.writeText(result.value.regex)
    ElMessage.success('正则已复制到剪贴板')
  } catch (error) {
    ElMessage.error(`复制失败：${error?.message || '无法访问剪贴板'}`)
  }
}
</script>

<style scoped lang="less">
.shop-page {
  color: var(--text-primary);
}
.shop-tabs { width: 100%; }

.page-heading,
.result-header,
.preset-actions,
.exact-colors {
  display: flex;
  align-items: center;
}

.page-heading {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;

  h2 { margin: 0 0 6px; font-size: 22px; }
  p { margin: 0; color: var(--text-secondary); }
}

.preset-actions { gap: 10px; }

.content-grid { align-items: start; }

.filter-column { display: grid; gap: 18px; }
.result-column { display: grid; gap: 18px; position: sticky; top: 20px; }

:deep(.el-card) {
  border: 1px solid var(--border-base);
  border-radius: 8px;
  box-shadow: none;
}

.filter-group + .filter-group {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border-light);
}

.filter-group h3 {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  gap: 8px 14px;

  :deep(.el-checkbox) { margin-right: 0; }
}

.weapon-grid { grid-template-columns: repeat(5, minmax(80px, 1fr)); }
.socket-preview { display: inline-block; min-width: 38px; margin-right: 5px; color: var(--el-color-primary); font-family: monospace; }

.exact-colors {
  flex-wrap: wrap;
  gap: 14px 22px;

  label { display: flex; align-items: center; gap: 7px; }
  :deep(.el-input-number) { width: 96px; }
}

.result-header { justify-content: space-between; }
.warning-list { display: grid; gap: 8px; margin-top: 12px; }
.copy-button { width: 100%; margin-top: 14px; }

.about-card {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;

  p { margin: 0 0 8px; }
  p:last-child { margin-bottom: 0; }
  a { color: var(--el-color-primary); }
}

@media (max-width: 1050px) {
  .result-column { position: static; }
}

@media (max-width: 760px) {
  .shop-page { padding: 12px; }
  .page-heading { align-items: flex-start; flex-direction: column; }
  .preset-actions { align-items: flex-start; flex-direction: column; width: 100%; }
  .option-grid, .weapon-grid { grid-template-columns: repeat(2, minmax(130px, 1fr)); }
}

@media (max-width: 480px) {
  .option-grid, .weapon-grid { grid-template-columns: 1fr; }
}
</style>
