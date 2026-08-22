<template>
  <section class="feedback-settings" aria-labelledby="feedback-title">
    <div class="feedback-heading">
      <div>
        <h3 id="feedback-title">问题反馈</h3>
        <p>描述遇到的问题并按需附上证据，我们会在 CloudBase 管理端集中处理。</p>
      </div>
      <el-tag type="info" effect="plain">匿名提交</el-tag>
    </div>

    <el-alert
      v-if="successId"
      class="feedback-success"
      type="success"
      :closable="false"
      show-icon
    >
      <template #title>
        反馈已提交，编号 <strong>{{ successId }}</strong>
        <el-button link type="success" @click="copyFeedbackId">复制编号</el-button>
      </template>
    </el-alert>

    <el-row class="feedback-grid app-grid" :gutter="16">
      <el-col :xs="24" :md="16"><el-card class="feedback-form-card" shadow="never">
        <el-form label-position="top" @submit.prevent="submitFeedback">
          <el-form-item label="反馈类型" required :error="errors.category">
            <el-select v-model="form.category" placeholder="请选择反馈类型" @change="errors.category = ''">
              <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="标题" required :error="errors.title">
            <el-input
              v-model="form.title"
              maxlength="80"
              show-word-limit
              placeholder="用一句话概括问题"
              @input="errors.title = ''"
            />
          </el-form-item>

          <el-form-item label="详细描述" required :error="errors.description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="9"
              maxlength="2000"
              show-word-limit
              resize="vertical"
              placeholder="请说明操作步骤、预期结果和实际现象"
              @input="errors.description = ''"
            />
          </el-form-item>

          <el-form-item label="联系方式（选填）" :error="errors.contact">
            <el-input
              v-model="form.contact"
              maxlength="200"
              placeholder="QQ、邮箱或其他方便联系的方式"
              @input="errors.contact = ''"
            />
          </el-form-item>

          <div v-if="submitError" class="submit-error" role="alert">{{ submitError }}</div>
          <div class="submit-row">
            <span class="progress-text" aria-live="polite">{{ progressText }}</span>
            <el-button type="primary" :loading="submitting" :disabled="submitting" @click="submitFeedback">
              {{ submitting ? '正在提交' : '提交反馈' }}
            </el-button>
          </div>
        </el-form>
      </el-card></el-col>

      <el-col :xs="24" :md="8" tag="aside" class="feedback-evidence">
        <el-card shadow="never">
          <template #header>
            <div class="evidence-header">
              <span>附件</span>
              <span>{{ attachments.length }}/5 · {{ totalSizeText }}</span>
            </div>
          </template>
          <el-button class="attachment-button" :icon="Paperclip" :disabled="submitting" @click="pickAttachments">
            添加图片或文件
          </el-button>
          <p class="limit-copy">单个不超过 10MB，合计不超过 30MB。支持图片、文本、PDF、Word 和压缩包。</p>
          <div v-if="attachments.length" class="attachment-list">
            <div v-for="item in attachments" :key="item.token" class="attachment-item">
              <div class="attachment-name">
                <span :title="item.name">{{ item.name }}</span>
                <small>{{ formatSize(item.size) }}</small>
              </div>
              <el-button link type="danger" :disabled="submitting" :aria-label="`移除 ${item.name}`" @click="removeAttachment(item.token)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <el-empty v-else :image-size="44" description="尚未添加附件" />
        </el-card>

        <el-card class="diagnostics-card" shadow="never">
          <div class="switch-row">
            <div>
              <strong>附带脱敏诊断</strong>
              <p>包含应用版本、系统与运行时状态、显示器/DPI和近期结构化原因码。</p>
            </div>
            <el-switch v-model="form.includeDiagnostics" :disabled="submitting || Boolean(diagnosticCapture)" />
          </div>
          <el-alert
            v-if="diagnosticCapture"
            class="diagnostic-capture-alert"
            :type="diagnosticCapture.status === 'active' ? 'warning' : 'info'"
            :closable="false"
            show-icon
            :title="captureStatusText"
          />
          <el-alert type="info" :closable="false" show-icon>
            默认关闭。不会自动上传账号令牌、Cookie、个人路径或诊断事件中的敏感原值。
          </el-alert>
          <div class="diagnostic-actions">
            <el-button
              :icon="Download"
              :loading="diagnosticsExporting"
              :disabled="submitting || diagnosticCaptureLoading"
              @click="exportDiagnostics()"
            >导出当前诊断</el-button>
            <el-button
              v-if="!diagnosticCapture"
              type="primary"
              plain
              :disabled="submitting"
              :loading="diagnosticCaptureLoading"
              @click="captureDialogVisible = true"
            >开始诊断会话</el-button>
            <template v-else>
              <el-button
                type="warning"
                plain
                :disabled="submitting"
                :loading="diagnosticCaptureLoading || diagnosticsExporting"
                @click="finishAndExportDiagnosticCapture"
              >{{ diagnosticCapture.status === 'active' ? '结束并导出' : '导出诊断会话' }}</el-button>
              <el-button :disabled="submitting" @click="cancelCapture">取消会话</el-button>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="captureDialogVisible" title="开始诊断会话" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="受影响模块" required>
          <el-select v-model="captureArea" placeholder="请选择模块" style="width: 100%">
            <el-option v-for="item in captureAreas" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题现象" required>
          <el-select v-model="captureSymptom" placeholder="请选择现象" style="width: 100%">
            <el-option v-for="item in captureSymptoms" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-alert :closable="false" type="info" title="会话最长 15 分钟。开始即表示同意在提交反馈时附带本次脱敏诊断。" />
      </el-form>
      <template #footer>
        <el-button @click="captureDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="diagnosticCaptureLoading"
          :disabled="!captureArea || !captureSymptom"
          @click="beginCapture"
        >开始</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Delete, Download, Paperclip } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'
import { useDiagnostics } from '@/composables/useDiagnostics'

const categories = [
  { label: '功能异常', value: 'bug' },
  { label: '操作问题', value: 'operation' },
  { label: '数据问题', value: 'data' },
  { label: '功能建议', value: 'suggestion' },
  { label: '其他', value: 'other' }
]
const captureAreas = [
  { value: 'system', label: '系统环境' }, { value: 'shortcuts', label: '快捷键' },
  { value: 'items', label: '物品制作' }, { value: 'bag', label: '背包入库' },
  { value: 'map', label: '地图洗图' }, { value: 'combat', label: '战斗辅助' },
  { value: 'story', label: '剧情指引' }, { value: 'shop', label: '商城配方' },
  { value: 'priceCheck', label: '国服查价' }, { value: 'crafting', label: '做装模拟' },
  { value: 'stashPickup', label: '仓库取件' }, { value: 'puzzle', label: '海图拼图' },
  { value: 'junfeng', label: '君锋镇取件' }
]
const captureSymptoms = [
  { value: 'cannot_start', label: '无法启动' }, { value: 'wrong_result', label: '结果错误' },
  { value: 'stops_during_use', label: '中途停止' }, { value: 'slow_or_stuck', label: '卡顿' },
  { value: 'intermittent', label: '偶发失效' }, { value: 'crash_or_exit', label: '崩溃退出' },
  { value: 'other_unexpected', label: '其他异常' }
]

const form = reactive({ category: '', title: '', description: '', contact: '', includeDiagnostics: false })
const errors = reactive({ category: '', title: '', description: '', contact: '' })
const attachments = ref([])
const submitting = ref(false)
const submitError = ref('')
const successId = ref('')
const progress = ref(null)
const captureDialogVisible = ref(false)
const captureArea = ref('')
const captureSymptom = ref('')
let removeProgressListener = null

const {
  diagnosticsExporting,
  diagnosticCapture,
  diagnosticCaptureLoading,
  captureStatusText,
  startDiagnosticCapture,
  finishAndExportDiagnosticCapture,
  prepareDiagnosticCaptureForFeedback,
  exportDiagnostics,
  cancelDiagnosticCapture,
  clearSubmittedDiagnosticCapture
} = useDiagnostics()

const totalSize = computed(() => attachments.value.reduce((sum, item) => sum + item.size, 0))
const totalSizeText = computed(() => formatSize(totalSize.value))
const progressText = computed(() => {
  if (!submitting.value || !progress.value) return ''
  if (progress.value.phase === 'finishing-diagnostics') return '正在结束诊断会话…'
  if (progress.value.phase === 'authenticating') return '正在建立匿名身份…'
  if (progress.value.phase === 'uploading') return `正在上传 ${progress.value.index}/${progress.value.total}：${progress.value.fileName}`
  if (progress.value.phase === 'saving') return '正在保存反馈…'
  return ''
})

function lengthOf(value) { return [...String(value || '').trim()].length }

function validate() {
  errors.category = form.category ? '' : '请选择反馈类型'
  errors.title = !lengthOf(form.title) ? '请输入标题' : lengthOf(form.title) > 80 ? '标题不能超过 80 个字符' : ''
  errors.description = !lengthOf(form.description) ? '请输入详细描述' : lengthOf(form.description) > 2000 ? '详细描述不能超过 2000 个字符' : ''
  errors.contact = lengthOf(form.contact) <= 200 ? '' : '联系方式不能超过 200 个字符'
  return !Object.values(errors).some(Boolean)
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function pickAttachments() {
  submitError.value = ''
  const result = await electronApi.feedback.pickAttachments()
  if (!result?.success) {
    submitError.value = result?.error || '附件选择失败，请重试'
    return
  }
  if (result.canceled) return
  const next = [...attachments.value, ...(result.attachments || [])]
  if (next.length > 5) {
    submitError.value = '最多选择 5 个附件'
    return
  }
  if (next.reduce((sum, item) => sum + item.size, 0) > 30 * 1024 * 1024) {
    submitError.value = '附件合计不能超过 30MB'
    return
  }
  attachments.value = next
}

function removeAttachment(token) {
  attachments.value = attachments.value.filter(item => item.token !== token)
}

async function beginCapture() {
  if (!await startDiagnosticCapture(captureArea.value, captureSymptom.value)) return
  form.includeDiagnostics = true
  captureDialogVisible.value = false
  captureArea.value = ''
  captureSymptom.value = ''
}

async function cancelCapture() {
  if (!await cancelDiagnosticCapture()) return
  form.includeDiagnostics = false
}

function resetForm() {
  form.category = ''
  form.title = ''
  form.description = ''
  form.contact = ''
  form.includeDiagnostics = false
  attachments.value = []
}

async function submitFeedback() {
  if (submitting.value || !validate()) return
  submitting.value = true
  submitError.value = ''
  successId.value = ''
  progress.value = { phase: 'finishing-diagnostics' }
  try {
    const prepared = await prepareDiagnosticCaptureForFeedback()
    if (!prepared.success) {
      submitError.value = prepared.error || '诊断会话结束失败，请重试'
      return
    }
    progress.value = { phase: 'authenticating' }
    const result = await electronApi.feedback.submit({
      category: form.category,
      title: form.title,
      description: form.description,
      contact: form.contact,
      includeDiagnostics: Boolean(prepared.captureId) || form.includeDiagnostics,
      ...(prepared.captureId ? { diagnosticCaptureId: prepared.captureId } : {}),
      attachmentTokens: attachments.value.map(item => item.token)
    })
    if (!result?.success) {
      submitError.value = result?.error || '反馈提交失败，请稍后重试'
      return
    }
    successId.value = result.feedbackId
    clearSubmittedDiagnosticCapture(prepared.captureId)
    resetForm()
  } catch {
    submitError.value = '反馈提交失败，请检查网络后重试'
  } finally {
    submitting.value = false
    progress.value = null
  }
}

watch(diagnosticCapture, capture => {
  if (capture) form.includeDiagnostics = true
})

async function copyFeedbackId() {
  if (!successId.value) return
  await electronApi.clipboard.writeText(successId.value)
  ElMessage.success('反馈编号已复制')
}

onMounted(() => {
  removeProgressListener = electronApi.feedback.onProgress(value => { progress.value = value })
})

onBeforeUnmount(() => {
  removeProgressListener?.()
  removeProgressListener = null
})
</script>

<style scoped lang="less">
.feedback-settings {
  .feedback-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    h3 { margin: 0 0 6px; color: var(--text-primary); font-size: 18px; }
    p { margin: 0; color: var(--text-secondary); line-height: 1.6; }
  }

  .feedback-success { margin-bottom: 16px; }
  :deep(.el-card) { background: var(--surface-1, var(--bg-primary)); box-shadow: inset 0 1px rgba(255,255,255,.025); }

  .feedback-grid {
    align-items: start;
  }

  .feedback-form-card :deep(.el-select) { width: 100%; }

  .feedback-evidence {
    display: grid;
    gap: 16px;
  }

  .evidence-header,
  .submit-row,
  .switch-row,
  .attachment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .evidence-header span:last-child { color: var(--text-secondary); font-size: 12px; }
  .attachment-button { width: 100%; }
  .limit-copy { color: var(--text-secondary); font-size: 12px; line-height: 1.6; }
  .attachment-list { display: grid; gap: 8px; margin-top: 12px; }
  .attachment-item { padding: 8px 10px; border: 1px solid var(--border-base); border-radius: 6px; background: var(--surface-2, var(--bg-tertiary)); }
  .attachment-name { min-width: 0; display: grid; gap: 3px; }
  .attachment-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-name small { color: var(--text-secondary); }
  .switch-row { align-items: flex-start; margin-bottom: 12px; }
  .switch-row strong { color: var(--text-primary); }
  .switch-row p { margin: 6px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.6; }
  .submit-row { justify-content: flex-end; min-height: 32px; }
  .progress-text { color: var(--text-secondary); font-size: 13px; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .submit-error { color: #F0AAA6; background: color-mix(in srgb, var(--el-color-danger) 13%, var(--surface-1)); border: 1px solid var(--el-color-danger); padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; }
  .diagnostic-capture-alert { margin-bottom: 12px; }
  .diagnostic-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
}

@media (max-width: 900px) {
}
</style>
