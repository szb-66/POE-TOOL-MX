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

    <div class="feedback-grid">
      <el-card class="feedback-form-card" shadow="never">
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
              placeholder="用一句话概括问题（5–80 字）"
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
              placeholder="请说明操作步骤、预期结果和实际现象（20–2000 字）"
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
      </el-card>

      <aside class="feedback-evidence">
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
            <el-switch v-model="form.includeDiagnostics" :disabled="submitting" />
          </div>
          <el-alert type="info" :closable="false" show-icon>
            默认关闭。不会自动上传账号令牌、Cookie、个人路径或诊断事件中的敏感原值。
          </el-alert>
        </el-card>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Delete, Paperclip } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'

const categories = [
  { label: '功能异常', value: 'bug' },
  { label: '操作问题', value: 'operation' },
  { label: '数据问题', value: 'data' },
  { label: '功能建议', value: 'suggestion' },
  { label: '其他', value: 'other' }
]

const form = reactive({ category: '', title: '', description: '', contact: '', includeDiagnostics: false })
const errors = reactive({ category: '', title: '', description: '', contact: '' })
const attachments = ref([])
const submitting = ref(false)
const submitError = ref('')
const successId = ref('')
const progress = ref(null)
let removeProgressListener = null

const totalSize = computed(() => attachments.value.reduce((sum, item) => sum + item.size, 0))
const totalSizeText = computed(() => formatSize(totalSize.value))
const progressText = computed(() => {
  if (!submitting.value || !progress.value) return ''
  if (progress.value.phase === 'authenticating') return '正在建立匿名身份…'
  if (progress.value.phase === 'uploading') return `正在上传 ${progress.value.index}/${progress.value.total}：${progress.value.fileName}`
  if (progress.value.phase === 'saving') return '正在保存反馈…'
  return ''
})

function lengthOf(value) { return [...String(value || '').trim()].length }

function validate() {
  errors.category = form.category ? '' : '请选择反馈类型'
  errors.title = lengthOf(form.title) >= 5 && lengthOf(form.title) <= 80 ? '' : '标题需为 5–80 个字符'
  errors.description = lengthOf(form.description) >= 20 && lengthOf(form.description) <= 2000 ? '' : '详细描述需为 20–2000 个字符'
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
  progress.value = { phase: 'authenticating' }
  try {
    const result = await electronApi.feedback.submit({
      category: form.category,
      title: form.title,
      description: form.description,
      contact: form.contact,
      includeDiagnostics: form.includeDiagnostics,
      attachmentTokens: attachments.value.map(item => item.token)
    })
    if (!result?.success) {
      submitError.value = result?.error || '反馈提交失败，请稍后重试'
      return
    }
    successId.value = result.feedbackId
    resetForm()
  } catch {
    submitError.value = '反馈提交失败，请检查网络后重试'
  } finally {
    submitting.value = false
    progress.value = null
  }
}

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

  .feedback-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    gap: 16px;
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
  .attachment-item { padding: 8px 10px; border: 1px solid var(--border-base); border-radius: var(--border-radius-base); }
  .attachment-name { min-width: 0; display: grid; gap: 3px; }
  .attachment-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-name small { color: var(--text-secondary); }
  .switch-row { align-items: flex-start; margin-bottom: 12px; }
  .switch-row strong { color: var(--text-primary); }
  .switch-row p { margin: 6px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.6; }
  .submit-row { justify-content: flex-end; min-height: 32px; }
  .progress-text { color: var(--text-secondary); font-size: 13px; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .submit-error { color: var(--el-color-danger); background: var(--el-color-danger-light-9); border: 1px solid var(--el-color-danger-light-7); padding: 10px 12px; border-radius: var(--border-radius-base); margin-bottom: 14px; }
}

@media (max-width: 900px) {
  .feedback-settings .feedback-grid { grid-template-columns: 1fr; }
}
</style>
