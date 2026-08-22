<template>
  <div class="puzzle-progress-overlay" :class="regionType">
    <div class="progress-label">海图 {{ completed }}/{{ total }}</div>
    <div v-if="regionType === 'inventory'" class="grid inventory-grid">
      <div
        v-for="cell in inventoryCells" :key="cell.index" class="cell"
        :class="{ source: sourceIndex === cell.index, uncertain: cell.slot?.uncertain }"
      >
        <PuzzleGlyph v-if="cell.slot?.occupied" :mask="cell.slot.mask" />
        <span v-if="cell.slot?.occupied">{{ cell.slot.orientation }}°</span>
      </div>
    </div>
    <div v-else class="grid atlas-grid">
      <div
        v-for="cell in atlasCells" :key="cell.index" class="cell"
        :class="{ current: currentIndex === cell.index, completed: cell.index < completed, failed: status === 'error' && currentIndex === cell.index }"
      >
        <PuzzleGlyph v-if="cell.target?.mask" :mask="cell.target.mask" />
        <b>{{ cell.index + 1 }}</b>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { electronApi } from '../../api/electron.js'
import PuzzleGlyph from './PuzzleGlyph.vue'

const route = useRoute()
const snapshot = ref({ status: 'validating', currentIndex: -1, completed: 0, total: 9, targets: [], slots: [] })
const regionType = computed(() => route.query.type === 'inventory' ? 'inventory' : 'atlas')
const completed = computed(() => Number(snapshot.value.completed || 0))
const total = computed(() => Number(snapshot.value.total || 9))
const currentIndex = computed(() => Number(snapshot.value.currentIndex ?? -1))
const status = computed(() => snapshot.value.status)
const sourceIndex = computed(() => snapshot.value.source ? Number(snapshot.value.source.row) * 6 + Number(snapshot.value.source.column) : -1)
const inventoryCells = computed(() => Array.from({ length: 60 }, (_, index) => ({ index, slot: snapshot.value.slots?.[index] || null })))
const atlasCells = computed(() => Array.from({ length: 9 }, (_, index) => ({ index, target: snapshot.value.targets?.[index] || null })))
let removeListener = null
onMounted(() => { removeListener = electronApi.puzzle.onAutoPlacementUpdated(data => { snapshot.value = { ...snapshot.value, ...data } }) })
onUnmounted(() => removeListener?.())
</script>

<style scoped>
.puzzle-progress-overlay { position: fixed; inset: 0; box-sizing: border-box; color: var(--text-primary); background: color-mix(in srgb, var(--app-bg) 8%, transparent); font-family: var(--font-ui); }
.grid { display: grid; width: 100%; height: 100%; }
.inventory-grid { grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(10, 1fr); }
.atlas-grid { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); }
.cell { position: relative; box-sizing: border-box; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--brand-color) 72%, transparent); color: color-mix(in srgb, var(--brand-color) 84%, white); background: color-mix(in srgb, var(--surface-1) 6%, transparent); }
.cell :deep(svg) { width: 46%; height: 46%; }
.cell span, .cell b { position: absolute; right: 3px; bottom: 2px; padding: 1px 3px; border-radius: var(--overlay-radius-sm); background: color-mix(in srgb, var(--surface-1) 78%, transparent); font-size: clamp(8px, 1.4vw, var(--overlay-font-size)); }
.cell.source, .cell.current { border: 3px solid #fbbf24; background: rgba(251, 191, 36, .2); color: #fde68a; }
.cell.completed { background: rgba(34, 197, 94, .25); color: #86efac; }
.cell.failed { border-color: #ef4444; background: rgba(239, 68, 68, .3); color: #fecaca; }
.cell.uncertain { border-color: #fb923c; }
.progress-label { position: fixed; z-index: 2; top: var(--overlay-space-1); left: 50%; transform: translateX(-50%); padding: 3px var(--overlay-space-3); border: 1px solid var(--overlay-border); border-radius: var(--overlay-radius-sm); background: var(--overlay-surface); font-size: var(--overlay-font-size-small); font-weight: 700; }
</style>
