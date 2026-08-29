<template>
  <section class="feedback-settings" aria-labelledby="feedback-title">
    <div class="feedback-heading">
      <h3 id="feedback-title">问题反馈</h3>
      <el-tag type="info" effect="plain">匿名提交</el-tag>
    </div>

    <el-tabs v-model="activeView" class="feedback-tabs" @tab-change="handleViewChange">
      <el-tab-pane label="提交反馈" name="submit" />
      <el-tab-pane name="mine">
        <template #label>
          <span class="mine-tab-label">
            我的反馈
            <span
              v-if="feedbackRepliesStore.unreadCount > 0"
              class="feedback-unread-dot"
              role="img"
              aria-label="有新回复"
            />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <template v-if="activeView === 'submit'">

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
          <div class="diagnostic-heading-row">
            <strong>附带脱敏诊断</strong>
            <el-switch v-model="form.includeDiagnostics" :disabled="submitting || Boolean(diagnosticCapture)" />
          </div>
          <p class="diagnostic-description">
            包含应用版本、系统与运行时状态、显示器/DPI和近期结构化原因码。默认关闭，不会自动上传账号令牌、Cookie、个人路径或诊断事件中的敏感原值。
          </p>
          <el-alert
            v-if="puzzleEvidence"
            class="puzzle-evidence-alert"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #title>检测到最近一次海图碎片识别失败证据</template>
            <p>
              {{ formatDate(puzzleEvidence.occurredAt) }} · {{ puzzleEvidence.attemptCount }} 次截图尝试 · 预计 {{ formatSize(puzzleEvidence.estimatedBytes) }}。
              开启附带诊断后会上传完整游戏客户端窗口、仓库画面、实际识别裁剪图和逐次网格指标；不会包含游戏窗口以外的桌面内容。
            </p>
            <el-button link type="danger" :loading="puzzleEvidenceLoading" :disabled="submitting" @click="discardPuzzleEvidence">取消并删除本地证据</el-button>
          </el-alert>
          <el-alert v-else-if="puzzleEvidenceError" class="puzzle-evidence-alert" type="error" :closable="false" :title="puzzleEvidenceError" />
          <el-alert
            v-if="diagnosticCapture"
            class="diagnostic-capture-alert"
            :type="diagnosticCapture.status === 'active' ? 'warning' : 'info'"
            :closable="false"
            show-icon
            :title="captureStatusText"
          />
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
    </template>

    <el-row v-else class="conversation-grid app-grid" :gutter="16">
      <el-col :xs="24" :md="9">
        <el-card shadow="never">
          <template #header><div class="conversation-header"><strong>我的反馈</strong><el-button :loading="listLoading || conversationLoading" @click="refreshConversations">手动刷新</el-button></div></template>
          <el-alert v-if="listError" type="error" :closable="false" :title="listError" />
          <el-skeleton v-if="listLoading && !conversationItems.length" :rows="4" animated />
          <el-empty v-else-if="!conversationItems.length" description="当前安装尚未提交反馈" />
          <div v-else class="conversation-list">
            <button v-for="item in conversationItems" :key="item.id" class="conversation-item" :class="{ active: selectedFeedbackId === item.id }" @click="openConversation(item.id)">
              <span><strong>{{ item.title }}</strong><small>{{ item.feedbackId }} · {{ formatDate(item.createdAt) }}</small></span>
              <el-tag size="small" :type="item.replyState === 'replied' ? 'success' : 'warning'" effect="plain">{{ replyStateLabel(item.replyState) }}</el-tag>
            </button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="15">
        <el-card class="conversation-card" shadow="never">
          <template #header><div class="conversation-header"><strong>对话详情</strong><el-button v-if="selectedFeedbackId" :loading="conversationLoading" @click="loadConversation(selectedFeedbackId)">刷新会话</el-button></div></template>
          <el-empty v-if="!selectedFeedbackId" description="请选择一条反馈" />
          <el-skeleton v-else-if="conversationLoading && !conversationDetail" :rows="6" animated />
          <el-alert v-else-if="conversationError" type="error" :closable="false" :title="conversationError" />
          <template v-if="conversationDetail">
            <div class="conversation-timeline">
              <article class="conversation-message user"><header><strong>我 · 原始问题</strong><time>{{ formatDate(conversationDetail.feedback.createdAt) }}</time></header><h4>{{ conversationDetail.feedback.title }}</h4><p>{{ conversationDetail.feedback.body }}</p><div v-if="conversationDetail.feedback.attachments.length" class="message-attachments"><a v-for="file in conversationDetail.feedback.attachments" :key="file.name" :href="file.downloadUrl || undefined" target="_blank" rel="noopener noreferrer">{{ file.name }}</a></div></article>
              <article v-for="message in conversationDetail.messages" :key="message.id" class="conversation-message" :class="message.authorRole"><header><strong>{{ message.authorRole === 'admin' ? '管理员' : '我' }}</strong><time>{{ formatDate(message.createdAt) }}</time></header><p>{{ message.body }}</p><div v-if="message.attachments.length" class="message-attachments"><a v-for="file in message.attachments" :key="file.name" :href="file.downloadUrl || undefined" target="_blank" rel="noopener noreferrer">{{ file.name }}</a></div></article>
            </div>
            <el-form class="reply-form" label-position="top" @submit.prevent="sendReply">
              <el-form-item label="继续回复"><el-input v-model="replyBody" type="textarea" :rows="5" maxlength="2000" show-word-limit placeholder="输入 1–2000 字回复" /></el-form-item>
              <el-button :icon="Paperclip" :disabled="replySending" @click="pickReplyAttachments">添加回复附件</el-button>
              <div v-if="replyAttachments.length" class="attachment-list"><div v-for="item in replyAttachments" :key="item.token" class="attachment-item"><div class="attachment-name"><span>{{ item.name }}</span><small>{{ formatSize(item.size) }}</small></div><el-button link type="danger" :disabled="replySending" @click="removeReplyAttachment(item.token)"><el-icon><Delete /></el-icon></el-button></div></div>
              <div v-if="replyError" class="submit-error" role="alert">{{ replyError }}</div>
              <div class="submit-row"><span class="progress-text">{{ replyProgressText }}</span><el-button type="primary" :loading="replySending" :disabled="replySending || !replyBody.trim()" @click="sendReply">发送回复</el-button></div>
            </el-form>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Delete, Download, Paperclip } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'
import { useDiagnostics } from '@/composables/useDiagnostics'
import { useFeedbackRepliesStore } from '@/stores/feedbackReplies'

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
const activeView = ref('submit')
const conversationItems = ref([])
const listLoading = ref(false)
const listError = ref('')
const selectedFeedbackId = ref('')
const conversationDetail = ref(null)
const conversationLoading = ref(false)
const conversationError = ref('')
const replyBody = ref('')
const replyAttachments = ref([])
const replySending = ref(false)
const replyProgress = ref(null)
const replyError = ref('')
const replyClientMessageId = ref('')
const captureDialogVisible = ref(false)
const captureArea = ref('')
const captureSymptom = ref('')
const puzzleEvidence = ref(null)
const puzzleEvidenceLoading = ref(false)
const puzzleEvidenceError = ref('')
let removeProgressListener = null
let removeReplyProgressListener = null

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

const feedbackRepliesStore = useFeedbackRepliesStore()
const route = useRoute()

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
const replyProgressText = computed(() => {
  if (!replySending.value || !replyProgress.value) return ''
  if (replyProgress.value.phase === 'authenticating') return '正在建立匿名身份…'
  if (replyProgress.value.phase === 'uploading') return `正在上传 ${replyProgress.value.index}/${replyProgress.value.total}：${replyProgress.value.fileName}`
  if (replyProgress.value.phase === 'saving') return '正在保存回复…'
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
function formatDate(value) { return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function replyStateLabel(value) { return value === 'replied' ? '已回复' : value === 'followed_up' ? '已追问，等待回复' : '等待回复' }

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

async function loadPuzzleEvidenceSummary() {
  puzzleEvidenceLoading.value = true
  puzzleEvidenceError.value = ''
  try {
    const result = await electronApi.feedback.getPuzzleEvidenceSummary()
    if (!result?.success) throw new Error('最近海图识别失败证据暂时无法读取')
    puzzleEvidence.value = result.evidence || null
  } catch (error) {
    puzzleEvidence.value = null
    puzzleEvidenceError.value = error?.message || '最近海图识别失败证据暂时无法读取'
  } finally {
    puzzleEvidenceLoading.value = false
  }
}

async function discardPuzzleEvidence() {
  const referenceId = puzzleEvidence.value?.referenceId
  if (!referenceId || puzzleEvidenceLoading.value) return
  puzzleEvidenceLoading.value = true
  puzzleEvidenceError.value = ''
  try {
    const result = await electronApi.feedback.discardPuzzleEvidence(referenceId)
    if (!result?.success) throw new Error('本地失败证据删除失败，请稍后重试')
    puzzleEvidence.value = null
  } catch (error) {
    puzzleEvidenceError.value = error?.message || '本地失败证据删除失败，请稍后重试'
  } finally {
    puzzleEvidenceLoading.value = false
  }
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
    const includeDiagnostics = Boolean(prepared.captureId) || form.includeDiagnostics
    const result = await electronApi.feedback.submit({
      category: form.category,
      title: form.title,
      description: form.description,
      contact: form.contact,
      includeDiagnostics,
      ...(prepared.captureId ? { diagnosticCaptureId: prepared.captureId } : {}),
      ...(includeDiagnostics && puzzleEvidence.value?.referenceId
        ? { puzzleFailureEvidenceId: puzzleEvidence.value.referenceId }
        : {}),
      attachmentTokens: attachments.value.map(item => item.token)
    })
    if (!result?.success) {
      submitError.value = result?.error || '反馈提交失败，请稍后重试'
      if (result?.errorCode === 'FEEDBACK_EVIDENCE_UNAVAILABLE') {
        await loadPuzzleEvidenceSummary()
        puzzleEvidenceError.value = '海图识别失败证据已失效。表单和其他附件已保留；请关闭附带诊断或重新复现后再提交。'
      }
      return
    }
    successId.value = result.feedbackId
    feedbackRepliesStore.registerSubmitted(result.id)
    clearSubmittedDiagnosticCapture(prepared.captureId)
    puzzleEvidence.value = null
    resetForm()
    activeView.value = 'mine'
    await loadConversations()
    await openConversation(result.id)
  } catch {
    submitError.value = '反馈提交失败，请检查网络后重试'
  } finally {
    submitting.value = false
    progress.value = null
  }
}

async function handleViewChange(name) { if (name === 'mine' && !conversationItems.value.length) await loadConversations() }

let focusingTarget = ''
async function focusFeedbackFromQuery(id) {
  const targetId = String(id || '')
  if (!targetId || selectedFeedbackId.value === targetId || focusingTarget === targetId) return
  focusingTarget = targetId
  try {
    if (!conversationItems.value.length) await loadConversations()
    if (!conversationItems.value.some(item => item.id === targetId)) return
    activeView.value = 'mine'
    await openConversation(targetId)
  } finally { focusingTarget = '' }
}
async function loadConversations() {
  listLoading.value = true; listError.value = ''
  try {
    const result = await electronApi.feedback.list()
    if (!result?.success) throw new Error(result?.error || '反馈列表加载失败')
    conversationItems.value = result.items || []
    // 兜底：通知跳转时列表可能尚未就绪（启动检查失败后手动刷新等），就绪后重试选中。
    const pendingId = String(route.query.feedbackId || '')
    if (pendingId && selectedFeedbackId.value !== pendingId && conversationItems.value.some(item => item.id === pendingId)) {
      void focusFeedbackFromQuery(pendingId)
    }
  } catch (error) { listError.value = error.message }
  finally { listLoading.value = false }
}
async function refreshConversations() {
  await Promise.all([
    loadConversations(),
    selectedFeedbackId.value ? loadConversation(selectedFeedbackId.value) : Promise.resolve()
  ])
}
async function openConversation(id) {
  selectedFeedbackId.value = id
  conversationDetail.value = null
  conversationError.value = ''
  replyBody.value = ''
  replyAttachments.value = []
  replyClientMessageId.value = ''
  await loadConversation(id)
  if (conversationDetail.value) {
    const listItem = conversationItems.value.find(item => item.id === id)
    feedbackRepliesStore.markSeen(id, listItem?.adminReplyCount, listItem?.lastMessageAuthor)
  }
}
async function loadConversation(id) {
  if (!id) return
  conversationLoading.value = true; conversationError.value = ''
  try {
    const result = await electronApi.feedback.conversation(id)
    if (!result?.success) throw new Error(result?.error || '会话加载失败')
    conversationDetail.value = result.conversation
  } catch (error) { conversationError.value = error.message }
  finally { conversationLoading.value = false }
}
async function pickReplyAttachments() {
  replyError.value = ''
  const result = await electronApi.feedback.pickReplyAttachments()
  if (!result?.success) { replyError.value = result?.error || '附件选择失败'; return }
  if (result.canceled) return
  const next = [...replyAttachments.value, ...(result.attachments || [])]
  if (next.length > 5 || next.reduce((sum, item) => sum + item.size, 0) > 30 * 1024 * 1024) { replyError.value = next.length > 5 ? '最多选择 5 个附件' : '附件合计不能超过 30MB'; return }
  replyAttachments.value = next
}
function removeReplyAttachment(token) { replyAttachments.value = replyAttachments.value.filter(item => item.token !== token) }
async function sendReply() {
  if (replySending.value || !selectedFeedbackId.value || !replyBody.value.trim()) return
  replySending.value = true; replyError.value = ''; replyProgress.value = { phase: 'authenticating' }
  if (!replyClientMessageId.value) replyClientMessageId.value = crypto.randomUUID()
  try {
    const result = await electronApi.feedback.reply({ feedbackId: selectedFeedbackId.value, clientMessageId: replyClientMessageId.value, body: replyBody.value, attachmentTokens: replyAttachments.value.map(item => item.token) })
    if (!result?.success) { replyError.value = result?.error || '回复发送失败'; return }
    feedbackRepliesStore.reactivate(selectedFeedbackId.value)
    replyBody.value = ''; replyAttachments.value = []; replyClientMessageId.value = ''
    await Promise.all([loadConversation(selectedFeedbackId.value), loadConversations()])
  } catch { replyError.value = '回复发送失败，请检查网络后重试' }
  finally { replySending.value = false; replyProgress.value = null }
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
  removeReplyProgressListener = electronApi.feedback.onReplyProgress(value => { replyProgress.value = value })
  loadConversations()
  loadPuzzleEvidenceSummary()
})

watch(() => route.query.feedbackId, (id) => { void focusFeedbackFromQuery(id) }, { immediate: true })

onBeforeUnmount(() => {
  removeProgressListener?.()
  removeProgressListener = null
  removeReplyProgressListener?.()
  removeReplyProgressListener = null
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

    h3 { margin: 0; color: var(--text-primary); font-size: 18px; }
  }

  .feedback-unread-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-left: 6px;
    border-radius: 50%;
    background: var(--el-color-danger);
  }

  .mine-tab-label { display: inline-flex; align-items: center; }
  .feedback-success { margin-bottom: 16px; }
  .feedback-tabs { margin-bottom: 16px; }
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
  .diagnostic-heading-row,
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
  .diagnostic-heading-row strong { color: var(--text-primary); }
  .diagnostic-description { margin: 8px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.6; }
  .puzzle-evidence-alert { margin-top: 12px; }
  .puzzle-evidence-alert p { margin: 6px 0; line-height: 1.6; }
  .submit-row { justify-content: flex-end; min-height: 32px; }
  .progress-text { color: var(--text-secondary); font-size: 13px; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .submit-error { color: #F0AAA6; background: color-mix(in srgb, var(--el-color-danger) 13%, var(--surface-1)); border: 1px solid var(--el-color-danger); padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; }
  .diagnostic-capture-alert { margin-bottom: 12px; }
  .diagnostic-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
  .diagnostic-actions :deep(.el-button) { width: 100%; margin-left: 0; }
  .conversation-grid { align-items: start; }
  .conversation-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .conversation-list { display: grid; gap: 8px; }
  .conversation-item { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; color: var(--text-primary); text-align: left; background: var(--surface-2, var(--bg-tertiary)); border: 1px solid var(--border-base); border-radius: 8px; cursor: pointer; }
  .conversation-item.active { border-color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 10%, var(--surface-2)); }
  .conversation-item > span { min-width: 0; display: grid; gap: 5px; }
  .conversation-item strong, .conversation-item small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .conversation-item small, .conversation-message time { color: var(--text-secondary); font-size: 12px; }
  .conversation-timeline { display: grid; gap: 12px; max-height: 520px; overflow-y: auto; padding-right: 4px; }
  .conversation-message { width: min(84%, 680px); padding: 14px; border: 1px solid var(--border-base); border-radius: 10px; background: var(--surface-2, var(--bg-tertiary)); }
  .conversation-message.admin { justify-self: end; border-color: color-mix(in srgb, var(--el-color-primary) 55%, var(--border-base)); }
  .conversation-message header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .conversation-message h4 { margin: 10px 0 0; }
  .conversation-message p { margin: 10px 0 0; color: var(--text-regular); line-height: 1.65; white-space: pre-wrap; }
  .message-attachments { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .message-attachments a { color: var(--el-color-primary); }
  .reply-form { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border-base); }
}

@media (max-width: 900px) {
}
</style>
