<template>
  <div class="tools-page">
    <header class="page-heading">
      <div>
        <h1>工具站</h1>
        <p>集中访问常用的流放之路站点，也可以按自己的习惯添加和排序。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">添加站点</el-button>
    </header>

    <div v-if="sites.length" class="site-grid" aria-label="工具站列表">
      <article
        v-for="(site, index) in sites"
        :key="site.id"
        class="site-card"
        :class="{ dragging: dragIndex === index, 'drag-target': dragTargetIndex === index }"
        role="link"
        tabindex="0"
        :aria-label="`打开 ${site.name}`"
        @click="openSite(site)"
        @keydown.enter.prevent="openSite(site)"
        @dragover.prevent="previewDrop(index)"
        @drop.prevent.stop="finishDrag(index)"
      >
        <div class="site-image" aria-hidden="true">
          <img
            v-if="currentImage(site)"
            :src="currentImage(site)"
            :alt="`${site.name} 图标`"
            @error="advanceImage(site)"
          >
          <span v-else>{{ siteInitial(site) }}</span>
        </div>

        <div class="site-content">
          <div class="site-title-row">
            <h2>{{ site.name }}</h2>
            <div class="site-actions" @click.stop @keydown.stop>
              <el-tooltip content="拖动排序" placement="top">
                <button
                  class="icon-action drag-handle"
                  type="button"
                  draggable="true"
                  :aria-label="`拖动 ${site.name} 排序`"
                  @dragstart.stop="startDrag($event, index)"
                  @dragend="clearDrag"
                >
                  <el-icon><Rank /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <button class="icon-action" type="button" :aria-label="`编辑 ${site.name}`" @click="openEditDialog(site)">
                  <el-icon><Edit /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <button class="icon-action danger" type="button" :aria-label="`删除 ${site.name}`" @click="confirmDelete(site)">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </div>
          <p class="site-description">{{ site.description || '暂无描述' }}</p>
          <div class="site-footer">
            <span class="site-url" :title="site.url">{{ site.url }}</span>
            <el-button text type="primary" size="small" :icon="TopRight" @click.stop="openSite(site)">打开</el-button>
          </div>
        </div>
      </article>
    </div>

    <el-empty v-else description="还没有站点">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">添加第一个站点</el-button>
    </el-empty>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑站点' : '添加站点'"
      width="min(560px, 92vw)"
      destroy-on-close
      @closed="resetForm"
    >
      <el-alert v-if="formErrors.form" :title="formErrors.form" type="error" :closable="false" show-icon />
      <el-form class="site-form" :model="form" label-width="92px" @submit.prevent="submitForm">
        <el-form-item label="站点名称" required :error="formErrors.name">
          <el-input v-model="form.name" maxlength="60" show-word-limit placeholder="例如：PoEDB" @input="clearFieldError('name')" />
        </el-form-item>
        <el-form-item label="站点地址" required :error="formErrors.url">
          <el-input v-model="form.url" placeholder="https://example.com/" @input="clearFieldError('url')" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="240" show-word-limit placeholder="简要说明这个站点的用途" />
        </el-form-item>
        <el-form-item label="图片地址" :error="formErrors.imageUrl">
          <el-input v-model="form.imageUrl" placeholder="可选，留空时自动读取站点图标" @input="clearFieldError('imageUrl')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Delete, Edit, Plus, Rank, TopRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addToolSite,
  deleteToolSite,
  loadToolSites,
  moveToolSite,
  saveToolSites,
  toolSiteImageCandidates,
  updateToolSite
} from './toolSites'

const emptyForm = () => ({ name: '', url: '', description: '', imageUrl: '' })
const sites = ref(loadToolSites())
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive(emptyForm())
const formErrors = reactive({})
const imageIndexes = reactive({})
const dragIndex = ref(-1)
const dragTargetIndex = ref(-1)

function clearErrors() {
  Object.keys(formErrors).forEach(key => delete formErrors[key])
}

function clearFieldError(field) {
  delete formErrors[field]
}

function resetForm() {
  editingId.value = ''
  Object.assign(form, emptyForm())
  clearErrors()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(site) {
  resetForm()
  editingId.value = site.id
  Object.assign(form, {
    name: site.name,
    url: site.url,
    description: site.description,
    imageUrl: site.imageUrl
  })
  dialogVisible.value = true
}

function commit(nextSites) {
  if (!saveToolSites(nextSites)) {
    ElMessage.error('保存失败，请检查本地存储是否可用')
    return false
  }
  sites.value = nextSites
  return true
}

function submitForm() {
  clearErrors()
  const result = editingId.value
    ? updateToolSite(sites.value, editingId.value, form)
    : addToolSite(sites.value, form)

  if (!result.success) {
    Object.assign(formErrors, result.errors)
    return
  }
  if (!commit(result.sites)) return

  imageIndexes[result.site.id] = 0
  dialogVisible.value = false
  ElMessage.success(editingId.value ? '站点已更新' : '站点已添加')
}

async function confirmDelete(site) {
  try {
    await ElMessageBox.confirm(
      `确定永久删除“${site.name}”吗？`,
      '删除站点',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  if (!commit(deleteToolSite(sites.value, site.id))) return
  delete imageIndexes[site.id]
  ElMessage.success('站点已删除')
}

function openSite(site) {
  window.open(site.url, '_blank', 'noopener,noreferrer')
}

function currentImage(site) {
  return toolSiteImageCandidates(site)[imageIndexes[site.id] || 0] || ''
}

function advanceImage(site) {
  imageIndexes[site.id] = (imageIndexes[site.id] || 0) + 1
}

function siteInitial(site) {
  return site.name.trim().charAt(0).toUpperCase() || '站'
}

function startDrag(event, index) {
  dragIndex.value = index
  dragTargetIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', sites.value[index].id)
}

function previewDrop(index) {
  if (dragIndex.value >= 0) dragTargetIndex.value = index
}

function finishDrag(index) {
  if (dragIndex.value < 0) return
  const nextSites = moveToolSite(sites.value, dragIndex.value, index)
  if (dragIndex.value !== index) commit(nextSites)
  clearDrag()
}

function clearDrag() {
  dragIndex.value = -1
  dragTargetIndex.value = -1
}
</script>

<style scoped lang="less">
.tools-page {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 22px;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 90% 0, color-mix(in srgb, var(--el-color-primary) 8%, transparent), transparent 30%),
    var(--bg-secondary);
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

h1 { margin: 0 0 5px; font-size: 25px; letter-spacing: .02em; }
.page-heading p { margin: 0; color: var(--text-secondary); font-size: 13px; }

.site-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-bottom: 4px;
}

.site-card {
  display: flex;
  min-width: 0;
  min-height: 132px;
  padding: 16px;
  border: 1px solid var(--border-base);
  border-radius: 10px;
  background: var(--bg-primary);
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease, opacity .18s ease;
}

.site-card:hover,
.site-card:focus-visible {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 7px 18px rgb(31 45 61 / 9%);
  outline: none;
  transform: translateY(-1px);
}

.site-card.dragging { opacity: .45; }
.site-card.drag-target { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px var(--el-color-primary-light-8); }

.site-image {
  display: grid;
  flex: 0 0 58px;
  width: 58px;
  height: 58px;
  margin-right: 14px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 23px;
  font-weight: 700;
}

.site-image img { width: 100%; height: 100%; object-fit: contain; }
.site-content { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.site-title-row, .site-footer, .site-actions { display: flex; align-items: center; }
.site-title-row { min-width: 0; justify-content: space-between; gap: 8px; }
.site-title-row h2 { overflow: hidden; margin: 0; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
.site-actions { flex: 0 0 auto; gap: 2px; }

.icon-action {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-action:hover { color: var(--el-color-primary); background: var(--el-fill-color); }
.icon-action.danger:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }

.site-description {
  display: -webkit-box;
  overflow: hidden;
  min-height: 36px;
  margin: 9px 0 7px;
  color: var(--text-regular);
  font-size: 13px;
  line-height: 18px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.site-footer { min-width: 0; justify-content: space-between; gap: 8px; margin-top: auto; }
.site-url { overflow: hidden; min-width: 0; color: var(--text-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.site-footer .el-button { flex: 0 0 auto; padding-right: 0; }
.site-form { padding-top: 8px; }

@media (max-width: 1180px) {
  .site-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .tools-page { padding: 15px; }
  .site-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .page-heading .el-button { width: 100%; }
}
</style>
