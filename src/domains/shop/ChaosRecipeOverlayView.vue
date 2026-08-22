<template>
  <div class="overlay-root">
    <div class="tracker" :class="state.status">
      <strong>{{ state.tabName || '商店配方' }} · {{ state.recipeLabel || '混沌石' }}</strong>
      <span>{{ state.message || `${state.items?.length || 0} 件待取` }}</span>
    </div>
    <div
      v-for="item in state.items || []"
      :key="item.id"
      class="item-box"
      :class="`recipe-${item.recipeId || state.recipeId || 'chaos'}`"
      :style="boxStyle(item)"
    >
      <span>{{ slotLabel(item) }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive } from 'vue'
import { electronApi } from '../../api/electron.js'

const state = reactive({ tabName: '', columns: 12, items: [], status: 'preview', message: '' })
let removeListener = null
const labels = {
  bodyArmour: '胸',
  oneHandWeapon: '单',
  twoHandWeapon: '双',
  helmet: '头',
  gloves: '手',
  boots: '鞋',
  belt: '腰',
  amulet: '链',
  ring: '戒'
}
const recipeLabels = { chance: '机', chaos: '混', regal: '富', exalted: '崇', chromatic: '幻', jeweller: '孔', fusing: '连' }

const slotLabel = (item) => recipeLabels[item.recipeId] || labels[item.itemClass] || ''
const boxStyle = (item) => {
  const columns = Number(state.columns || 12)
  return {
    left: `${Number(item.x) * 100 / columns}%`,
    top: `${Number(item.y) * 100 / columns}%`,
    width: `${Math.max(1, Number(item.width) || 1) * 100 / columns}%`,
    height: `${Math.max(1, Number(item.height) || 1) * 100 / columns}%`
  }
}

onMounted(async () => {
  const response = await electronApi.chaosRecipe.getOverlayState()
  if (response?.success && response.data) Object.assign(state, response.data)
  removeListener = electronApi.chaosRecipe.onOverlayState((snapshot) => Object.assign(state, snapshot || {}))
})
onUnmounted(() => removeListener?.())
</script>

<style scoped>
.overlay-root { position: fixed; inset: 0; overflow: hidden; background: transparent; }
.tracker {
  position: absolute;
  z-index: 3;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--overlay-space-3);
  padding: var(--overlay-space-1) var(--overlay-space-3);
  color: var(--text-primary);
  background: var(--overlay-surface);
  border: 1px solid var(--brand-color);
  border-radius: var(--overlay-radius-md);
  box-shadow: var(--overlay-shadow);
  font-size: var(--overlay-font-size);
  white-space: nowrap;
}
.tracker.running { border-color: var(--success-color); }
.tracker.stopped { border-color: var(--danger-color); }
.item-box {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  background: rgba(230, 162, 60, .2);
  border: 3px solid #ffd04b;
  box-shadow: inset 0 0 12px rgba(255, 208, 75, .4), 0 0 8px rgba(255, 208, 75, .8);
}
.recipe-chance { border-color: #d6c47a; }
.recipe-regal { border-color: #c6a6ff; }
.recipe-exalted { border-color: #f4d35e; background: rgba(244, 211, 94, .24); }
.recipe-chromatic { border-color: #ff7f7f; background: rgba(90, 190, 130, .24); }
.recipe-jeweller { border-color: #8fd3ff; background: rgba(80, 150, 220, .24); }
.recipe-fusing { border-color: #ff9f43; background: rgba(255, 159, 67, .24); }
</style>
