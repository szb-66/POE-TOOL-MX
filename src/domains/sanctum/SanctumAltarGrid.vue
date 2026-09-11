<template>
  <div class="placement-view">
    <div class="altar-grid" :style="{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${height}, 42px)` }" aria-label="圣物摆放">
      <span v-for="cell in width * height" :key="`cell-${cell}`" class="cell" :class="{ locked: !unlocked.includes(cell - 1) }"
        :style="{ gridColumn: (cell - 1) % width + 1, gridRow: Math.floor((cell - 1) / width) + 1 }" :title="unlocked.includes(cell - 1) ? '可用格' : '未解锁或未确认'" />
      <button v-for="(item, index) in placements" :key="item.id" class="relic-block" :class="{ selected: selectedId === item.id }"
        :style="{ gridColumn: `${item.x + 1} / span ${item.width}`, gridRow: `${item.y + 1} / span ${item.height}`, '--relic-color': colors[index % colors.length] }"
        :title="`${index + 1}. ${name(item)} · ${item.width}×${item.height}`" @click="$emit('select', item.id)">{{ index + 1 }}</button>
    </div>
    <div class="placement-key"><button v-for="(item, index) in placements" :key="item.id" :class="{ selected: selectedId === item.id }" @click="$emit('select', item.id)">{{ index + 1 }}. {{ name(item) }}</button></div>
  </div>
</template>
<script setup>
const props = defineProps({ width: { type: Number, default: 5 }, height: { type: Number, default: 4 }, unlocked: { type: Array, default: () => [] }, placements: { type: Array, default: () => [] }, inventory: { type: Array, default: () => [] }, selectedId: String })
defineEmits(['select'])
const colors = ['#427aaa', '#8a65a8', '#39857b', '#a67839', '#a95d73', '#657c3b']
const name = item => props.inventory.find(relic => relic.id === item.id)?.name || item.name || '未识别圣物'
</script>
<style scoped lang="less">
.altar-grid { display: grid; gap: 3px; max-width: 360px; min-width: 200px; }
.cell { border: 1px solid var(--el-border-color); border-radius: 4px; background: var(--el-fill-color-blank); &.locked { background: repeating-linear-gradient(45deg, var(--el-fill-color-dark), var(--el-fill-color-dark) 4px, var(--el-fill-color-light) 4px, var(--el-fill-color-light) 8px); } }
.relic-block { z-index: 1; margin: 2px; border: 1px solid var(--relic-color); border-radius: 5px; background: var(--relic-color); color: white; font-size: 18px; font-weight: 700; cursor: pointer; }
.selected, button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.placement-key { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; button { color: var(--el-text-color-primary); background: var(--el-fill-color-light); border: 1px solid var(--el-border-color); border-radius: 4px; padding: 5px 8px; cursor: pointer; } }
</style>
