<template>
  <div class="overlay-root">
    <div class="tracker" :class="state.status">
      <strong>{{ state.tabName || '混沌配方' }}</strong>
      <span>{{ state.message || `${state.items?.length || 0} 件待取` }}</span>
    </div>
    <div
      v-for="item in state.items || []"
      :key="item.id"
      class="item-box"
      :style="boxStyle(item)"
    >
      <span>{{ slotLabel(item.itemClass) }}</span>
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

const slotLabel = (value) => labels[value] || ''
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
  gap: 8px;
  padding: 5px 10px;
  color: #fff;
  background: rgba(20, 20, 24, .88);
  border: 1px solid #e6a23c;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
}
.tracker.running { border-color: #67c23a; }
.tracker.stopped { border-color: #f56c6c; }
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
</style>
