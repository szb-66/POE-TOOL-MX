<template>
  <div class="training-page">
    <div class="training-content">
      <div class="page-heading">
        <div>
          <h2>高亮模型训练</h2>
          <p>统一采集君锋镇、小仓库和大仓库素材，人工复核后更新当前取件模型。</p>
        </div>
        <el-tag type="warning" effect="plain">仅开发版</el-tag>
      </div>

      <el-card class="section-card">
        <div class="highlight-training">
          <el-alert
            title="训练完成后会直接更新当前取件模型。验证结果用于判断质量，不再限制取件功能；请在训练前完整核对标注。"
            type="warning"
            :closable="false"
          />
          <el-form label-width="140px" label-position="left">
            <el-form-item label="素材来源">
              <el-select v-model="trainingDomain" style="width: 220px">
                <el-option v-for="entry in trainingProfiles" :key="entry.value" :label="entry.label" :value="entry.value" />
              </el-select>
              <el-tag :type="junfengStore.trainingRegions[trainingDomain] ? 'success' : 'info'">
                {{ junfengStore.trainingRegions[trainingDomain] ? '区域已框选' : '区域未框选' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="数据用途">
              <el-select v-model="trainingPartition" style="width: 220px">
                <el-option label="训练集（模型学习）" value="train" />
                <el-option label="验证集（调参检查）" value="validation" />
                <el-option label="最终测试集（质量评估）" value="test" />
              </el-select>
              <span class="hint-text">{{ trainingPartitionHint }}</span>
            </el-form-item>
            <el-form-item label="采集区域">
              <el-button @click="pickTrainingRegion">框选当前网格</el-button>
              <el-button :loading="junfengStore.trainingBusy" @click="captureTraining">采集并识别</el-button>
            </el-form-item>
          </el-form>

          <div v-if="junfengStore.trainingPreview" class="training-preview">
            <div class="preview-summary">
              {{ trainingProfileLabel(junfengStore.trainingPreview.domain) }} ·
              {{ trainingPartitionLabel(junfengStore.trainingPreview.partition) }} ·
              会话 {{ junfengStore.trainingPreview.previewId }} · 请逐格核对
            </div>
            <el-alert
              v-if="junfengStore.trainingPreview.blind"
              title="验证集和最终测试集采用盲标：模型答案已隐藏。请先批量设置接近的状态，再逐格修正空格或例外。"
              type="warning"
              :closable="false"
            />
            <el-alert
              v-if="junfengStore.trainingPreview.reconstructed"
              title="这是旧版会话，完整原图未保存；当前画面由原始格子图块重建。仍可逐格复核、修改用途或删除。"
              type="info"
              :closable="false"
            />
            <HighlightGridPreview
              :image-src="junfengStore.trainingPreview.rawImageDataUrl || junfengStore.trainingPreview.imageDataUrl"
              alt="高亮模型训练采集预览"
              :cells="junfengStore.trainingPreview.cells"
              :columns="junfengStore.trainingPreview.grid.columns"
              :rows="junfengStore.trainingPreview.grid.rows"
              :labels="junfengStore.trainingLabels"
              :review-focus-key="reviewFocusKey"
              editable
              @change="junfengStore.setTrainingLabel($event.cell, $event.label)"
            />
            <div class="training-row">
              <span class="hint-text">批量初标：</span>
              <el-button size="small" @click="junfengStore.setAllTrainingLabels('highlighted')">全部高亮</el-button>
              <el-button size="small" @click="junfengStore.setAllTrainingLabels('dimmed')">全部灰暗</el-button>
              <el-button size="small" @click="junfengStore.setAllTrainingLabels('empty')">全部空格</el-button>
              <el-tag v-if="trainingUnknownCount" type="warning">未标注 {{ trainingUnknownCount }}</el-tag>
            </div>
            <div class="training-row">
              <el-select v-if="junfengStore.reviewingSessionId" v-model="junfengStore.trainingPreview.partition" style="width: 220px">
                <el-option label="训练集" value="train" />
                <el-option label="验证集" value="validation" />
                <el-option label="最终测试集" value="test" />
              </el-select>
              <el-button type="primary" plain :disabled="trainingUnknownCount > 0" @click="saveTrainingSession">
                {{ junfengStore.reviewingSessionId ? '保存复核修改' : '保存整张已核对标注' }}
              </el-button>
            </div>
          </div>

          <div class="training-row">
            <el-tag>会话 {{ junfengStore.trainingStatus.summary?.sessions || 0 }}</el-tag>
            <el-tag>样本 {{ junfengStore.trainingStatus.summary?.samples || 0 }}</el-tag>
            <el-tag type="success">高亮 {{ junfengStore.trainingStatus.summary?.labels?.highlighted || 0 }}</el-tag>
            <el-tag type="info">灰暗 {{ junfengStore.trainingStatus.summary?.labels?.dimmed || 0 }}</el-tag>
            <el-tag>空格 {{ junfengStore.trainingStatus.summary?.labels?.empty || 0 }}</el-tag>
          </div>
          <div class="training-row">
            <el-input-number v-model="trainingEpochs" :min="10" :max="500" :step="10" />
            <span class="hint-text">训练轮数</span>
            <el-button type="primary" :loading="junfengStore.trainingStatus.status === 'running'" @click="trainHighlightModel">
              GPU 训练并更新当前模型
            </el-button>
            <el-button
              type="success"
              plain
              :disabled="testSessionCount < 3 || junfengStore.trainingStatus.status === 'running'"
              :title="testSessionCount < 3 ? '至少需要 3 个已审计最终测试会话' : '使用锁定最终测试集进行独立质量评估'"
              @click="evaluateHighlightModel"
            >运行最终测试（可选）</el-button>
          </div>
          <el-alert
            v-if="junfengStore.trainingStatus.stage || junfengStore.trainingStatus.reason"
            :title="`${junfengStore.trainingStatus.stage || '训练状态'}${junfengStore.trainingStatus.reason ? `：${junfengStore.trainingStatus.reason}` : ''}`"
            :type="junfengStore.trainingStatus.status === 'failed' ? 'error' : 'info'"
            :closable="false"
          />
          <div v-if="junfengStore.trainingStatus.report" class="training-metrics">
            {{ trainingPartitionLabel(junfengStore.trainingStatus.report.partition) }}结果 ·
            {{ junfengStore.trainingStatus.report.audited ? '人工真值' : '旧自动标签' }} ·
            误报 {{ junfengStore.trainingStatus.report.falsePositives }} ·
            漏报 {{ junfengStore.trainingStatus.report.falseNegatives }} ·
            召回率 {{ formatProbability(junfengStore.trainingStatus.report.recall) }} ·
            零高亮误点击 {{ junfengStore.trainingStatus.report.zeroHighlightClicks }} ·
            覆盖 {{ junfengStore.trainingStatus.report.coveragePassed === false ? '不足' : '合格' }} ·
            {{ junfengStore.trainingStatus.report.passed ? '达到建议标准' : '未达到建议标准' }}
          </div>
          <el-table v-if="junfengStore.trainingStatus.report?.errors?.length" :data="junfengStore.trainingStatus.report.errors" size="small" max-height="260">
            <el-table-column label="错误" width="90"><template #default="scope">{{ scope.row.kind === 'false-positive' ? '误报' : '漏报' }}</template></el-table-column>
            <el-table-column label="格子" width="90"><template #default="scope">{{ scope.row.column + 1 }},{{ scope.row.row + 1 }}</template></el-table-column>
            <el-table-column label="人工答案" width="100"><template #default="scope">{{ junfengLabel(scope.row.actualLabel) }}</template></el-table-column>
            <el-table-column label="高亮概率" width="110"><template #default="scope">{{ formatProbability(scope.row.highlightProbability) }}</template></el-table-column>
            <el-table-column label="复核"><template #default="scope"><el-button link @click="reviewEvaluationError(scope.row)">在原图中查看</el-button></template></el-table-column>
          </el-table>

          <div class="session-header">
            <strong>历史标注会话（{{ filteredTrainingSessions.length }} / {{ junfengStore.trainingSessions.length }}）</strong>
            <span class="hint-text">所有修改都会增加修订号；最终测试会话永不进入训练。</span>
          </div>
          <div class="session-filters">
            <el-select v-model="sessionDomainFilter" aria-label="按来源筛选历史标注会话" style="width: 220px">
              <el-option label="全部来源" value="" />
              <el-option v-for="entry in trainingProfiles" :key="entry.value" :label="entry.label" :value="entry.value" />
            </el-select>
            <el-select v-model="sessionPartitionFilter" aria-label="按用途筛选历史标注会话" style="width: 180px">
              <el-option label="全部用途" value="" />
              <el-option label="训练集" value="train" />
              <el-option label="验证集" value="validation" />
              <el-option label="最终测试集" value="test" />
              <el-option label="旧自动数据" value="legacy" />
            </el-select>
          </div>
          <el-table v-if="filteredTrainingSessions.length" :data="filteredTrainingSessions" size="small" max-height="340">
            <el-table-column label="来源" width="150"><template #default="scope">{{ trainingProfileLabel(scope.row.domain) }}</template></el-table-column>
            <el-table-column label="用途" width="120"><template #default="scope"><el-tag :type="trainingPartitionTag(scope.row.partition)">{{ trainingPartitionLabel(scope.row.partition) }}</el-tag></template></el-table-column>
            <el-table-column label="标签统计"><template #default="scope">亮 {{ scope.row.labels.highlighted || 0 }} · 灰 {{ scope.row.labels.dimmed || 0 }} · 空 {{ scope.row.labels.empty || 0 }}</template></el-table-column>
            <el-table-column label="审计" width="100"><template #default="scope"><el-tag :type="scope.row.audited ? 'success' : 'warning'">{{ scope.row.audited ? '人工确认' : '旧数据' }}</el-tag></template></el-table-column>
            <el-table-column label="修订" width="70"><template #default="scope">v{{ scope.row.revision || 0 }}</template></el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button link @click="reviewTrainingSession(scope.row)">复核</el-button>
                <el-button link type="danger" @click="deleteTrainingSession(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-else-if="junfengStore.trainingSessions.length"
            description="没有符合筛选条件的历史标注会话"
            :image-size="72"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useJunfengStore } from '@/stores/junfeng'
import HighlightGridPreview from '@/components/highlight/HighlightGridPreview.vue'

const junfengStore = useJunfengStore()
const trainingDomain = ref('junfeng')
const trainingPartition = ref('train')
const trainingEpochs = ref(100)
const reviewFocusKey = ref('')
const sessionDomainFilter = ref('')
const sessionPartitionFilter = ref('')
const trainingProfiles = [
  { value: 'junfeng', label: '君锋镇奖励 12×11' },
  { value: 'small-stash', label: '小仓库 12×12' },
  { value: 'large-stash', label: '大仓库 24×24' }
]
const trainingLabelCounts = computed(() => Object.values(junfengStore.trainingLabels).reduce((counts, label) => {
  if (Object.hasOwn(counts, label)) counts[label] += 1
  return counts
}, { highlighted: 0, dimmed: 0, empty: 0, unknown: 0 }))
const trainingUnknownCount = computed(() => trainingLabelCounts.value.unknown)
const filteredTrainingSessions = computed(() => junfengStore.trainingSessions.filter(session =>
  (!sessionDomainFilter.value || session.domain === sessionDomainFilter.value) &&
  (!sessionPartitionFilter.value || session.partition === sessionPartitionFilter.value)
))
const testSessionCount = computed(() => junfengStore.trainingSessions.filter(session => session.partition === 'test' && session.audited).length)
const trainingPartitionHint = computed(() => ({
  train: '显示模型初判，人工纠错后用于学习。',
  validation: '隐藏模型答案，用于训练过程中选择候选模型。',
  test: '隐藏模型答案，至少保留 3 个独立会话用于最终质量评估。'
})[trainingPartition.value])

async function pickTrainingRegion() {
  try { await junfengStore.pickTrainingRegion(trainingDomain.value) } catch (error) { ElMessage.error(error.message) }
}

async function captureTraining() {
  try { await junfengStore.captureTraining(trainingDomain.value, trainingPartition.value); reviewFocusKey.value = '' }
  catch (error) { ElMessage.error(error.message) }
}

async function saveTrainingSession() {
  try {
    await ElMessageBox.confirm('请确认已经逐格核对整张预览。错误标签会直接影响模型训练。', '保存训练标注', { type: 'warning' })
    await junfengStore.saveTrainingSession()
    ElMessage.success('训练会话已保存')
  } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || String(error)) }
}

async function reviewTrainingSession(session) {
  try {
    await junfengStore.reviewTrainingSession(session.id)
    trainingDomain.value = session.domain
    trainingPartition.value = junfengStore.trainingPreview.partition
    reviewFocusKey.value = ''
  } catch (error) { ElMessage.error(error.message) }
}

async function deleteTrainingSession(session) {
  try {
    await ElMessageBox.confirm(`删除这张${trainingPartitionLabel(session.partition)}会话及其全部格子？此操作不可撤销。`, '删除标注会话', { type: 'warning' })
    await junfengStore.deleteTrainingSession(session.id)
    ElMessage.success('标注会话已删除')
  } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || String(error)) }
}

async function reviewEvaluationError(errorCell) {
  try {
    await junfengStore.reviewTrainingSession(errorCell.previewId)
    trainingDomain.value = junfengStore.trainingPreview.domain
    trainingPartition.value = junfengStore.trainingPreview.partition
    reviewFocusKey.value = `${errorCell.column}:${errorCell.row}`
  } catch (error) { ElMessage.warning(`该错误来自旧数据，尚无可回看的完整原图：${error.message}`) }
}

async function trainHighlightModel() {
  try {
    await ElMessageBox.confirm('训练完成后将直接覆盖当前取件模型。是否继续？', '更新当前模型', { type: 'warning' })
    await junfengStore.trainModel(trainingEpochs.value)
    ElMessage.success('当前取件模型已更新；请查看验证结果并运行检测预览')
  } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || String(error)) }
}

async function evaluateHighlightModel() {
  try { await junfengStore.evaluateModel(); ElMessage.success('最终测试完成，质量结果已记录') }
  catch (error) { ElMessage.error(error.message) }
}

function trainingProfileLabel(domain) { return trainingProfiles.find(entry => entry.value === domain)?.label || domain }
function trainingPartitionLabel(partition) { return ({ train: '训练集', validation: '验证集', test: '最终测试集', legacy: '旧自动数据' })[partition || 'validation'] || partition }
function trainingPartitionTag(partition) { return ({ train: '', validation: 'warning', test: 'danger', legacy: 'info' })[partition] || 'info' }
function junfengLabel(label) { return ({ highlighted: '高亮', dimmed: '灰暗', empty: '空格', unknown: '未知' })[label] || label }
function formatProbability(value) { const number = Number(value); return Number.isFinite(number) ? `${(number * 100).toFixed(1)}%` : '' }
</script>

<style scoped lang="less">
.training-page { height: 100%; overflow-y: auto; background: var(--bg-secondary); }
.training-content { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.page-heading h2 { margin: 0 0 6px; color: var(--text-primary); font-size: 20px; }
.page-heading p { margin: 0; color: var(--text-secondary); font-size: 13px; }
.section-card { box-shadow: none; border: 1px solid var(--border-base); }
.highlight-training, .training-preview { display: grid; gap: 14px; }
.hint-text, .preview-summary, .training-metrics { color: var(--text-secondary); font-size: 12px; }
.hint-text { margin-left: 8px; }
.training-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.session-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.session-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
</style>
