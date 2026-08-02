<template>
  <svg class="puzzle-glyph" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="5" />
    <path v-if="resolvedMask & DIRECTIONS.N" d="M50 50V4" />
    <path v-if="resolvedMask & DIRECTIONS.E" d="M50 50H96" />
    <path v-if="resolvedMask & DIRECTIONS.S" d="M50 50V96" />
    <path v-if="resolvedMask & DIRECTIONS.W" d="M50 50H4" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { DIRECTIONS, maskForType } from './solver.js'

const props = defineProps({
  mask: { type: Number, default: null },
  type: { type: String, default: null },
  orientation: { type: Number, default: 0 }
})

const resolvedMask = computed(() => props.mask === null
  ? maskForType(props.type, props.orientation)
  : Number(props.mask) & 15)
</script>

<style scoped>
.puzzle-glyph {
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 8;
  stroke-linecap: round;
}
</style>
