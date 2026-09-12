<template>
<section class="sanctum-section">
          <el-card  shadow="never">
            <template #header><div class="section-heading"><b>{{ roomTitle(selectedRoom) }}</b><el-tag>{{ selectedId }}</el-tag></div></template>

            <p v-if="selectedRoom.previousCapture">上次采集结果 · {{ selectedRoom.failureReason || '本次采集中' }}</p>
            <p>通关目标：{{ layoutLabels[shownGameplay.layout] || '未知' }} · 奖励功能：{{ roomTypeLabels[shownGameplay.type] || '未知' }}</p>
            <p>已知陷阱：{{ shownGameplay.traps?.map(key => trapLabels[key] || key).join('、') || '未确认（不代表无陷阱）' }}</p>
            <p v-if="shownGameplay.layoutPreferenceKey === 'trap'">偏好按“穿越陷阱”计算</p>
            <p v-if="shownResult.nameCandidates?.length > 1">名称候选：{{ shownResult.nameCandidates.join('、') }}；仅采用候选一致的属性</p>
            <p v-if="shownGameplay.roomProfile" class="room-sources">玩法来源：<a v-for="source in shownGameplay.roomProfile.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }}</a> · 核对于 {{ shownGameplay.roomProfile.reviewedAt }}</p>
            <p v-else-if="shownGameplay.layout && shownResult.knowledge?.layout?.source === 'manual'">玩法来源：手动确认</p>
            <p v-for="(reward, i) in shownResult.rewards || []" :key="`reward-${i}`">{{ rewardDetail(reward) }}</p>
            <article v-for="(match, i) in visibleMatches" :key="`match-${i}`"><b>{{ match.name }}</b><p v-for="description in match.descriptions || []" :key="description">{{ description }}</p><small v-if="['boon','affliction'].includes(match.kind)">{{ match.calculationStatus === 'supported' ? '已纳入路线评估，按实际资源和触发条件计算' : match.supportReason || '此效果暂未参与路线计算' }}</small></article>
            <p v-if="selectedRoom.readStages?.ocr === 'queued'">截图已完成，等待文字识别</p>
            <p v-else-if="selectedRoom.readStages?.ocr === 'reading'">正在识别冻结图片中的文字…</p>
            <p v-if="selectedRoom.readStages?.icons === 'queued'">文字已识别，正在确认奖励图标…</p>
            <p v-if="selectedRoom.failureReason">{{ selectedRoom.failureReason }}</p>
            <div class="toolbar"><el-button @click="editing = !editing">{{ editing ? '收起修正' : '修正房间信息' }}</el-button><el-button @click="evidence = !evidence">{{ evidence ? '关闭截图' : '核对识别截图' }}</el-button></div>
            <SanctumRoomRecognition v-if="evidence" :room="selectedRoom" :floor="floor" />
            <div v-if="editing">
            <el-form :inline="true" label-position="top" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">
              <el-form-item label="房间名称"><el-input v-model="roomDraft.name" maxlength="160" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" /></el-form-item>
              <el-form-item label="奖励功能"><el-select v-model="roomDraft.type" placeholder="待确认" clearable style="width: 160px" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed"><el-option v-for="(label, value) in roomTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
              <el-form-item label="通关目标"><el-select v-model="roomDraft.layout" placeholder="待确认" clearable style="width:150px"><el-option v-for="(label,key) in layoutLabels" :key="key" :label="label" :value="key" /></el-select></el-form-item>
              <el-form-item label="喷泉费用（未知留空）"><el-input-number v-model="roomDraft.recoveryCost" :min="0" :max="1000000" /></el-form-item>
              <el-form-item label="坚毅恢复量"><el-input-number v-model="roomDraft.recovery" :min="0" :max="1000000" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" /></el-form-item>
              <el-form-item label="圣物偏好分"><el-input-number v-model="roomDraft.relicScore" :min="0" :max="1000000" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" /></el-form-item>
            </el-form>
            <div v-for="(reward, index) in roomDraft.rewards" :key="index" class="toolbar">
              <el-input v-model="reward.currency" maxlength="100" placeholder="奖励名称" aria-label="奖励名称" style="width: 180px" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" />
              <el-input v-model="reward.groupId" placeholder="奖励组选项（默认同组）" style="width:180px" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" />
              <el-input-number v-model="reward.quantity" :min="0" :max="1000000" aria-label="奖励数量" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed" />
              <el-select v-model="reward.timing" aria-label="领取时机" style="width: 160px" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed"><el-option v-for="(label, value) in timingLabels" :key="value" :label="label" :value="value" /></el-select>
              <el-button @click="roomDraft.rewards.splice(index, 1)" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">删除奖励</el-button>
            </div>
            <el-button :disabled="store.readOnly || roomDraft.rewards.length >= 20" @click="roomDraft.rewards.push({ currency: '', quantity: null, timing: 'unknown', groupId:'offer' })">添加奖励修正</el-button>
            </div>
            <div class="toolbar">
              <el-button :disabled="store.readOnly || store.state.running || store.state.captureDraining" @click="perform('rescanRoom', { id: selectedId, runId: store.state.floor.runId, floorId: store.state.floor.floorId, revision: store.state.floor.revision })">重扫此房间</el-button>
              <el-button v-if="editing" type="primary" @click="perform('correctRoom', selectedId, roomDraft)" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">保存修正</el-button>
              <el-button @click="perform('setCurrentRoom', { id: selectedId, runId: store.state.floor.runId, floorId: store.state.floor.floorId, revision: store.state.floor.revision })" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">设为当前位置</el-button>
              <el-button @click="perform('setCurrentRoom', { id: null, runId: store.state.floor.runId, floorId: store.state.floor.floorId, revision: store.state.floor.revision })" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">恢复自动定位</el-button>
              <el-button @click="mark('targets')" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">{{ store.state.marks.targets.includes(selectedId) ? '取消目标' : '设为目标' }}</el-button>
              <el-button @click="mark('avoid')" :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed">{{ store.state.marks.avoid.includes(selectedId) ? '取消避让' : '避让此房' }}</el-button>
            </div>
            <p>修正仅用于当前地图；重新采集后请核对最新结果。</p>
          </el-card>

</section>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useSanctumActions } from './useSanctumActions.js'
const { store, perform } = useSanctumActions()
import SanctumRoomRecognition from './SanctumRoomRecognition.vue'
import { roomTitle, layoutLabels, roomTypeLabels, timingLabels, rewardDetail } from '../../../shared/sanctumPresentation.js'
import { knownRoom } from '../../../shared/sanctumRoomKnowledge.js'
import { applySanctumEffects } from '../../../shared/sanctum.js'
import { trapLabels } from '../../../shared/sanctumRoomProfiles.js'
const props = defineProps({ room: { type: Object, required: true }, floor: { type: Object, required: true } })
const editing = ref(false), evidence = ref(false)
const selectedRoom = computed(() => props.room), selectedId = computed(() => props.room.id)
const shownResult = computed(() => selectedRoom.value.previousCapture?.result || selectedRoom.value)
const shownGameplay = computed(() => knownRoom(shownResult.value, props.floor, selectedRoom.value.previousCapture ? {} : applySanctumEffects(store.state.currentEffects || [])))
const visibleMatches = computed(() => (shownResult.value.recognition?.matches || []).filter(match => match.role !== 'value'))
const roomDraft = reactive({ layout:'',recoveryCost:null, name: '', type: '', recovery: 0, relicScore: 0, rewards: [] })
function selectRoom(room) { Object.assign(roomDraft, { layout:room.layout||'',recoveryCost:room.recoveryCost??null,name: room.name || '', type: room.type || '', recovery: room.recovery || 0,
  relicScore: room.relicScore || 0, rewards: JSON.parse(JSON.stringify(room.rewards || [])) }) }
function mark(key) {
  const marks = JSON.parse(JSON.stringify(store.state.marks))
  marks[key] = marks[key].includes(selectedId.value) ? marks[key].filter(id => id !== selectedId.value) : [...marks[key], selectedId.value]
  void perform('setMarks', marks)
}
watch(() => props.room, room => { if (!editing.value) selectRoom(room) }, { immediate: true })
watch(editing, value => { if (value) selectRoom(props.room) })

</script>
<style scoped lang="less">
@import "./sanctumSection.less";
.room-sources a { margin-right: 8px; }
</style>
