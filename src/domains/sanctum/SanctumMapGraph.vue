<template>
  <g class="sanctum-graph" :class="{ interactive }">
    <defs><marker :id="markerId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#69efad" /></marker></defs>
    <line v-for="(line, index) in lines" :key="index" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
      :class="['edge', line.displayState, { recommended: line.recommended }]" :marker-end="line.recommended ? `url(#${markerId})` : undefined" />
    <g v-for="room in rooms" :key="room.id" :class="['room', room.displayState, { recommended: room.recommended }]"
      :tabindex="interactive ? 0 : undefined" :role="interactive ? 'button' : undefined"
      :aria-label="`房间 ${room.id} · ${roomTitle(room)} · ${sanctumRoomLabel(room)} · ${roomCardSummary(room)}`"
      @click="select(room)" @keydown.enter.prevent="select(room)" @keydown.space.prevent="select(room)">
      <title>{{ roomTitle(room) }} · {{ sanctumRoomLabel(room) }} · {{ roomCardSummary(room) }}</title>
      <rect class="card" :x="room.x" :y="room.y" :width="room.width" :height="room.height" rx="6" />
      <rect v-if="room.next" class="next-ring" :x="room.x + 5" :y="room.y + 5" :width="Math.max(0, room.width - 10)" :height="Math.max(0, room.height - 10)" rx="4" />
      <rect v-if="room.current" class="current-ring" :x="room.x - 5" :y="room.y - 5" :width="room.width + 10" :height="room.height + 10" rx="9" />
      <rect class="selection-ring" :class="{ selected: room.id === selectedId }" :x="room.x - 10" :y="room.y - 10" :width="room.width + 20" :height="room.height + 20" rx="10" />
      <text v-if="interactive" class="room-id" :x="room.x + room.width / 2" :y="room.y + room.height / 2 - 8" text-anchor="middle">{{ short(roomTitle(room), room.width) }}</text>
      <g v-if="interactive && room.rewards?.length" :transform="`translate(${room.x + 10},${room.y + room.height / 2 + 4})`">
        <text class="reward-label" y="18">{{ room.id }} ·</text>
        <g v-for="(reward, index) in room.rewards" :key="index" :transform="`translate(${54 + index * iconSize(room)},0)`">
          <title>{{ reward.currency || '未知奖励' }}</title>
          <image v-if="currencyIcon(reward.currency)" :href="currencyIcon(reward.currency)" :width="iconSize(room)" height="28" preserveAspectRatio="xMidYMid meet" />
          <text v-else class="reward-label" y="18">?</text>
        </g>
      </g>
      <text v-else-if="interactive" class="reward-label" :x="room.x + room.width / 2" :y="room.y + room.height / 2 + 22" text-anchor="middle"><title>{{ roomCardSummary(room) }}</title>{{ room.id }} · {{ short(roomEntrySummary(room) || sanctumRoomDetail(room), room.width - 60) }}</text>
      <text class="status-label" :class="{ 'current-label': room.current }" :x="room.x + room.width / 2" :y="room.y - 14" text-anchor="middle">{{ sanctumRoomLabel(room) }}</text>
      <text v-if="!interactive" class="detail-label" :x="room.x + room.width / 2" :y="room.y + room.height + 20" text-anchor="middle">{{ sanctumRoomDetail(room) }}</text>
    </g>
  </g>
</template>
<script setup>
import { sanctumRoomLabel, sanctumRoomDetail } from '../../../shared/sanctumDisplay.js'
import { roomTitle, roomCardSummary, roomEntrySummary } from '../../../shared/sanctumPresentation.js'
import { currencyIcon } from './currencyIcons.js'
const iconSize = room => Math.min(30, (room.width - 76) / Math.max(1, room.rewards?.length || 0))
const short = (text, width) => {
  let used = 0, result = ''
  for (const char of text) {
    used += /[\x00-\x7f]/.test(char) ? 11 : 22
    if (used > width - 16) return result + '…'
    result += char
  }
  return result
}
const props = defineProps({ rooms: { type: Array, default: () => [] }, lines: { type: Array, default: () => [] },
  interactive: Boolean, selectedId: { type: String, default: '' }, markerId: { type: String, required: true } })
const emit = defineEmits(['select'])
function select(room) { if (props.interactive) emit('select', room) }
</script>
<style scoped lang="less">
.sanctum-graph { --state-color: #91a8bf; }
.completed { --state-color: #b99a58; }
.unreachable { --state-color: #e77f87; }
.unknown { --state-color: #a4adbb; }
.recommended { --state-color: #69efad; }
.edge { stroke: var(--state-color); stroke-width: 2; vector-effect: non-scaling-stroke;
  &.completed { stroke-width: 3; } &.unreachable { opacity: .5; }
  &.unknown { stroke-dasharray: 6 5; } &.recommended { stroke-width: 4; }
}
.room { .card { fill: none; stroke: var(--state-color); stroke-width: 2; vector-effect: non-scaling-stroke; }
  &.unreachable { opacity: .5; } &.unknown .card { stroke-dasharray: 6 5; }
  &.recommended .card { stroke-width: 3; }
}
.interactive .room { cursor: pointer; .card { fill: var(--el-bg-color); } }
.next-ring, .current-ring, .selection-ring { fill: none; vector-effect: non-scaling-stroke; }
.next-ring { stroke: #69efad; stroke-width: 1.5; }
.current-ring { stroke: #55c9ed; stroke-width: 2.5; }
.selection-ring { stroke: #fff; stroke-width: 1.5; stroke-dasharray: 2 4; visibility: hidden; }
.selection-ring.selected, .interactive .room:focus-visible .selection-ring { visibility: visible; }
text { paint-order: stroke; stroke: #111827; stroke-width: 4px; stroke-linejoin: round; font-family: sans-serif; }
.room-id { fill: #eff3f8; font-size: 24px; }
.status-label { fill: var(--state-color); font-size: 18px; font-weight: 600; }
.current-label { fill: #55c9ed; }
.detail-label { fill: #e0e5ed; font-size: 16px; }
.interactive { text { stroke: var(--el-bg-color); } .room-id { fill: var(--el-text-color-primary); font-size: 22px; } .reward-label { fill: var(--el-text-color-secondary); font-size: 18px; } .status-label { font-size: 22px; } .detail-label { fill: var(--el-text-color-secondary); font-size: 20px; } .selection-ring { stroke: var(--el-color-primary); } }
 .interactive {
  --recommend-color: #287849; --current-color: #157899; --completed-color: #8b6424;
  .recommended { --state-color: var(--recommend-color); }
  .completed { --state-color: var(--completed-color); }
  .unreachable { --state-color: var(--el-color-danger); }
  .current-ring { stroke: var(--current-color); }
  .current-label { fill: var(--current-color); }
  .next-ring { stroke: var(--recommend-color); }
  marker path { fill: var(--recommend-color); }
}
:global(.app-dark-theme) .interactive { --recommend-color: #69efad; --current-color: #55c9ed; --completed-color: #b99a58; }
</style>
