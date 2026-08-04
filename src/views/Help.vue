<template>
  <main class="help-page">
    <header class="help-hero">
      <div>
        <span class="eyebrow">使用指南与规则参考</span>
        <h1>帮助中心</h1>
        <p>从首次配置到高级做装规则，在一个地方找到答案。</p>
      </div>
      <el-input
        v-model="searchQuery"
        class="help-search"
        clearable
        size="large"
        placeholder="搜索 DPI、Ctrl+D、花园、卡兰德之镜…"
        aria-label="搜索帮助内容"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </header>

    <div class="help-shell">
      <nav class="category-nav" aria-label="帮助分类">
        <button
          v-for="category in HELP_CATEGORIES"
          :key="category.id"
          type="button"
          :class="{ active: activeCategory === category.id && !hasSearch }"
          @click="selectCategory(category.id)"
        >
          <span>{{ category.label }}</span>
          <small>{{ category.description }}</small>
        </button>
      </nav>

      <section ref="contentScroll" class="help-content" aria-live="polite">
        <template v-if="hasSearch">
          <header class="section-heading search-heading">
            <div>
              <span class="eyebrow">全文搜索</span>
              <h2>“{{ searchQuery.trim() }}”的结果</h2>
              <p v-if="searchResults.length">找到 {{ searchResults.length }} 个相关专题。</p>
            </div>
            <el-button text @click="clearSearch">清空搜索</el-button>
          </header>

          <div v-if="searchResults.length" class="search-results">
            <button
              v-for="topic in searchResults"
              :key="topic.id"
              type="button"
              class="search-result"
              @click="openTopic(topic)"
            >
              <span>{{ categoryLabel(topic.category) }}</span>
              <strong>{{ topic.title }}</strong>
              <p>{{ topic.summary }}</p>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <el-empty v-else description="没有找到相关帮助内容">
            <el-button type="primary" plain @click="clearSearch">清空搜索</el-button>
          </el-empty>
        </template>

        <template v-else>
          <section v-if="activeCategory === 'getting-started'" class="category-section">
            <div class="free-banner">
              <el-icon><WarningFilled /></el-icon>
              <div><strong>本工具完全免费</strong><span>遇到任何付费情况，请尽快联系相关人员退款。</span></div>
            </div>

            <header class="section-heading">
              <div>
                <span class="eyebrow">从这里开始</span>
                <h2>第一次使用，只需四步</h2>
                <p>先完成安全配置与小规模测试，再启用自动化功能。</p>
              </div>
              <el-button type="primary" @click="navigateTo('/settings')">前往设置</el-button>
            </header>

            <div class="quick-grid">
              <article v-for="step in QUICK_START_STEPS" :key="step.number">
                <span>{{ step.number }}</span>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </article>
            </div>

            <article class="safety-card">
              <el-icon><CircleCheck /></el-icon>
              <div>
                <strong>安全试运行检查</strong>
                <p>游戏保持前台 · 窗口与 DPI 已校准 · 停止快捷键可用 · 使用少量、低价值物品。</p>
              </div>
            </article>
          </section>

          <section v-else-if="activeCategory === 'features'" class="category-section">
            <header class="section-heading">
              <div><span class="eyebrow">全部模块</span><h2>功能指南</h2><p>了解模块用途、准备工作和基础步骤，再前往对应页面。</p></div>
            </header>
            <div class="module-grid">
              <article
                v-for="topic in categoryTopics"
                :key="topic.id"
                :ref="element => rememberTopicElement(topic.id, element)"
                :data-topic-id="topic.id"
                class="module-card"
                tabindex="-1"
              >
                <header><span>{{ moduleNumber(topic.id) }}</span><div><h3>{{ topic.title }}</h3><p>{{ topic.summary }}</p></div></header>
                <div v-if="isExpanded(topic.id)" class="module-guide">
                  <dl><dt>用途</dt><dd>{{ topic.module.purpose }}</dd><dt>使用前提</dt><dd>{{ topic.module.prerequisite }}</dd></dl>
                  <strong>基础步骤</strong>
                  <ol><li v-for="step in topic.module.steps" :key="step">{{ step }}</li></ol>
                  <p class="risk-note"><el-icon><Warning /></el-icon>{{ topic.module.risk }}</p>
                </div>
                <footer>
                  <el-button text @click="toggleTopic(topic)">{{ isExpanded(topic.id) ? '收起指南' : '查看指南' }}</el-button>
                  <el-button type="primary" plain @click="navigateTo(topic.route)">打开{{ topic.title }}</el-button>
                </footer>
              </article>
            </div>
          </section>

          <section v-else class="category-section">
            <header class="section-heading">
              <div><span class="eyebrow">{{ activeCategoryMeta.description }}</span><h2>{{ activeCategoryMeta.label }}</h2><p>{{ categoryIntro }}</p></div>
            </header>

            <div v-if="activeCategory === 'about'" class="version-card">
              <div><small>当前版本</small><strong>V{{ packageConfig.version }}</strong></div>
              <a :href="PROJECT_URL" target="_blank" rel="noreferrer">查看 GitHub 项目<el-icon><TopRight /></el-icon></a>
            </div>

            <div class="topic-list">
              <article
                v-for="topic in categoryTopics"
                :key="topic.id"
                :ref="element => rememberTopicElement(topic.id, element)"
                :data-topic-id="topic.id"
                class="topic-card"
                tabindex="-1"
              >
                <button
                  type="button"
                  class="topic-trigger"
                  :aria-expanded="isExpanded(topic.id)"
                  :aria-controls="`topic-body-${topic.id}`"
                  @click="toggleTopic(topic)"
                >
                  <span><strong>{{ topic.title }}</strong><small>{{ topic.summary }}</small></span>
                  <el-icon :class="{ expanded: isExpanded(topic.id) }"><ArrowDown /></el-icon>
                </button>
                <div v-if="isExpanded(topic.id)" :id="`topic-body-${topic.id}`" class="topic-body">
                  <template v-for="(block, index) in topic.blocks" :key="`${topic.id}-${index}`">
                    <p v-if="block.type === 'paragraph'">{{ block.text }}</p>
                    <h4 v-else-if="block.type === 'heading'">{{ block.text }}</h4>
                    <ul v-else-if="block.type === 'list'"><li v-for="item in block.items" :key="item">{{ item }}</li></ul>
                    <p v-else-if="block.type === 'callout'" class="topic-callout" :class="block.tone">{{ block.text }}</p>
                  </template>
                  <el-button v-if="topic.route" type="primary" plain @click="navigateTo(topic.route)">打开相关页面</el-button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, ArrowRight, CircleCheck, Search, TopRight, Warning, WarningFilled } from '@element-plus/icons-vue'
import packageConfig from '../../package.json'
import {
  HELP_CATEGORIES,
  HELP_TOPICS,
  MODULE_TOPICS,
  QUICK_START_STEPS,
  findHelpTopic,
  searchHelpTopics
} from '../domains/help/helpContent.js'

const PROJECT_URL = 'https://github.com/szb-66/POE-TOOL-MX'
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const activeCategory = ref('getting-started')
const expandedTopicIds = ref([])
const contentScroll = ref(null)
const topicElements = new Map()

const hasSearch = computed(() => Boolean(searchQuery.value.trim()))
const searchResults = computed(() => searchHelpTopics(HELP_TOPICS, searchQuery.value))
const activeCategoryMeta = computed(() => HELP_CATEGORIES.find(category => category.id === activeCategory.value) || HELP_CATEGORIES[0])
const categoryTopics = computed(() => HELP_TOPICS.filter(topic => topic.category === activeCategory.value))
const categoryIntro = computed(() => ({
  faq: '按现象查找排查方法；所有诊断与配置仍由对应功能页执行。',
  crafting: '完整保留当前 POE1 3.29 规则、数据来源与准确性边界。',
  about: '了解应用版本、数据归属、本地隐私和社区维护信息。'
})[activeCategory.value] || '')

function categoryLabel(categoryId) {
  return HELP_CATEGORIES.find(category => category.id === categoryId)?.label || categoryId
}

function moduleNumber(topicId) {
  return String(MODULE_TOPICS.findIndex(topic => topic.id === topicId) + 1).padStart(2, '0')
}

function rememberTopicElement(topicId, element) {
  if (element) topicElements.set(topicId, element)
  else topicElements.delete(topicId)
}

function isExpanded(topicId) {
  return expandedTopicIds.value.includes(topicId)
}

function setExpanded(topicId, expanded) {
  const values = new Set(expandedTopicIds.value)
  if (expanded) values.add(topicId)
  else values.delete(topicId)
  expandedTopicIds.value = [...values]
}

async function selectCategory(categoryId) {
  searchQuery.value = ''
  activeCategory.value = categoryId
  await router.replace({ path: '/help' })
  contentScroll.value?.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
}

async function openTopic(topic, updateRoute = true) {
  if (!topic) return
  searchQuery.value = ''
  activeCategory.value = topic.category
  setExpanded(topic.id, true)
  if (updateRoute) await router.replace({ path: '/help', query: { topic: topic.id } })
  await nextTick()
  await nextTick()
  const element = topicElements.get(topic.id)
  element?.focus({ preventScroll: true })
  element?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

async function toggleTopic(topic) {
  const shouldExpand = !isExpanded(topic.id)
  setExpanded(topic.id, shouldExpand)
  if (shouldExpand) {
    await router.replace({ path: '/help', query: { topic: topic.id } })
  } else if (route.query.topic === topic.id) {
    await router.replace({ path: '/help' })
  }
}

function clearSearch() {
  searchQuery.value = ''
}

function navigateTo(path) {
  if (path) void router.push(path)
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

watch(
  () => route.query.topic,
  topicId => {
    if (!topicId) return
    const topic = findHelpTopic(String(topicId))
    if (topic) void openTopic(topic, false)
    else {
      activeCategory.value = 'getting-started'
      void router.replace({ path: '/help' })
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.help-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 92% -10%, color-mix(in srgb, var(--el-color-primary) 10%, transparent), transparent 32%),
    var(--bg-secondary);
}

.help-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 22px 26px 18px;
  border-bottom: 1px solid var(--border-base);
  background: color-mix(in srgb, var(--bg-primary) 94%, transparent);
}
.eyebrow { display: block; margin-bottom: 5px; color: var(--el-color-primary); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.help-hero h1, .section-heading h2 { margin: 0; letter-spacing: .01em; }
.help-hero h1 { font-size: 26px; }
.help-hero p, .section-heading p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.help-search { width: min(430px, 44vw); }

.help-shell { min-height: 0; flex: 1; display: grid; grid-template-columns: 220px minmax(0, 1fr); }
.category-nav { padding: 18px 12px; border-right: 1px solid var(--border-base); background: var(--bg-primary); }
.category-nav button {
  width: 100%;
  display: grid;
  gap: 4px;
  padding: 12px 13px;
  margin-bottom: 5px;
  border: 0;
  border-radius: 9px;
  color: var(--text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.category-nav button:hover { background: var(--el-fill-color-light); }
.category-nav button.active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); box-shadow: inset 3px 0 var(--el-color-primary); }
.category-nav span { font-size: 14px; font-weight: 650; }
.category-nav small { color: var(--text-secondary); font-size: 11px; line-height: 1.35; }

.help-content { min-width: 0; overflow-y: auto; padding: 22px 26px 32px; scroll-padding-top: 20px; }
.category-section, .search-heading, .search-results, .help-content > .el-empty { width: min(1040px, 100%); margin-inline: auto; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.section-heading h2 { font-size: 22px; }

.free-banner, .safety-card { display: flex; align-items: center; gap: 12px; border-radius: 10px; }
.free-banner { margin-bottom: 20px; padding: 12px 15px; border: 1px solid var(--el-color-warning-light-7); background: var(--el-color-warning-light-9); }
.free-banner > .el-icon { color: var(--el-color-warning); font-size: 20px; }
.free-banner div { display: flex; flex-wrap: wrap; gap: 5px 12px; }
.free-banner span { color: var(--text-secondary); font-size: 12px; }

.quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.quick-grid article { min-height: 150px; padding: 17px; border: 1px solid var(--border-base); border-radius: 11px; background: var(--bg-primary); }
.quick-grid article > span { display: inline-grid; width: 30px; height: 30px; place-items: center; border-radius: 8px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 11px; font-weight: 700; }
.quick-grid h3 { margin: 24px 0 7px; font-size: 15px; }
.quick-grid p { margin: 0; color: var(--text-secondary); font-size: 12px; line-height: 1.65; }
.safety-card { margin-top: 14px; padding: 14px 16px; color: var(--el-color-success); border: 1px solid var(--el-color-success-light-7); background: var(--el-color-success-light-9); }
.safety-card .el-icon { font-size: 21px; }
.safety-card p { margin: 3px 0 0; color: var(--text-secondary); font-size: 12px; }

.module-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.module-card, .topic-card, .version-card { border: 1px solid var(--border-base); border-radius: 11px; background: var(--bg-primary); }
.module-card { min-width: 0; padding: 16px; scroll-margin-top: 18px; outline: none; }
.module-card:focus-visible, .topic-card:focus-visible { box-shadow: 0 0 0 3px var(--el-color-primary-light-7); }
.module-card > header { display: flex; gap: 12px; }
.module-card > header > span { flex: 0 0 28px; color: var(--el-color-primary); font-size: 11px; font-weight: 700; }
.module-card h3 { margin: 0 0 5px; font-size: 16px; }
.module-card header p { margin: 0; color: var(--text-secondary); font-size: 12px; }
.module-card footer { display: flex; justify-content: flex-end; gap: 5px; margin-top: 14px; }
.module-guide { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--border-base); font-size: 12px; line-height: 1.65; }
.module-guide dl { display: grid; grid-template-columns: 60px 1fr; gap: 7px 10px; margin: 0 0 12px; }
.module-guide dt { color: var(--text-secondary); }
.module-guide dd { margin: 0; }
.module-guide ol { margin: 6px 0 12px; padding-left: 20px; }
.risk-note { display: flex; gap: 7px; margin: 0; padding: 9px 10px; border-radius: 7px; color: var(--text-secondary); background: var(--el-color-warning-light-9); }
.risk-note .el-icon { flex: 0 0 auto; margin-top: 3px; color: var(--el-color-warning); }

.topic-list { display: grid; gap: 10px; }
.topic-card { overflow: hidden; scroll-margin-top: 18px; outline: none; }
.topic-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 18px; border: 0; color: var(--text-primary); background: transparent; text-align: left; cursor: pointer; }
.topic-trigger:hover { background: var(--el-fill-color-lighter); }
.topic-trigger > span { display: grid; gap: 5px; }
.topic-trigger strong { font-size: 14px; }
.topic-trigger small { color: var(--text-secondary); font-size: 12px; }
.topic-trigger .el-icon { flex: 0 0 auto; transition: transform .18s ease; }
.topic-trigger .el-icon.expanded { transform: rotate(180deg); }
.topic-body { padding: 4px 20px 20px; border-top: 1px solid var(--border-base); color: var(--text-regular); font-size: 13px; line-height: 1.75; }
.topic-body p { margin: 13px 0 0; }
.topic-body h4 { margin: 17px 0 5px; color: var(--text-primary); }
.topic-body ul { margin: 12px 0 0; padding-left: 21px; }
.topic-body li { margin-bottom: 8px; }
.topic-body > .el-button { margin-top: 14px; }
.topic-callout { padding: 10px 12px; border-radius: 7px; background: var(--el-fill-color-light); }
.topic-callout.warning { background: var(--el-color-warning-light-9); }

.version-card { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; padding: 17px 19px; }
.version-card div { display: grid; gap: 3px; }
.version-card small { color: var(--text-secondary); }
.version-card strong { font-size: 20px; }
.version-card a { display: flex; align-items: center; gap: 5px; color: var(--el-color-primary); text-decoration: none; }

.search-heading { align-items: center; }
.search-results { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
.search-result { position: relative; min-width: 0; min-height: 126px; display: grid; align-content: start; gap: 6px; padding: 16px 42px 16px 17px; border: 1px solid var(--border-base); border-radius: 10px; color: var(--text-primary); background: var(--bg-primary); text-align: left; cursor: pointer; }
.search-result:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 5px 18px rgba(0, 0, 0, .05); }
.search-result > span { color: var(--el-color-primary); font-size: 11px; }
.search-result strong { font-size: 14px; }
.search-result p { margin: 0; color: var(--text-secondary); font-size: 12px; line-height: 1.55; }
.search-result .el-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); }

@media (max-width: 1050px) {
  .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 820px) {
  .help-hero { align-items: flex-start; padding: 16px; }
  .help-search { width: min(390px, 50vw); }
  .help-shell { display: flex; flex-direction: column; }
  .category-nav { display: flex; flex: 0 0 auto; gap: 6px; overflow-x: auto; padding: 9px 12px; border-right: 0; border-bottom: 1px solid var(--border-base); }
  .category-nav button { flex: 0 0 auto; width: auto; min-width: 112px; margin: 0; padding: 9px 12px; }
  .category-nav button.active { box-shadow: inset 0 -3px var(--el-color-primary); }
  .category-nav small { display: none; }
  .help-content { padding: 18px 16px 28px; }
  .module-grid, .search-results { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .help-hero { flex-direction: column; gap: 14px; }
  .help-search { width: 100%; }
  .section-heading { align-items: flex-start; flex-direction: column; }
  .quick-grid { grid-template-columns: 1fr; }
  .quick-grid article { min-height: auto; }
  .quick-grid h3 { margin-top: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .topic-trigger .el-icon, .search-result { transition: none; }
  * { scroll-behavior: auto !important; }
}
</style>
