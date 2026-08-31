<template>
  <div class="topic-list">
    <article v-for="topic in topics" :key="topic.id" class="topic-card" tabindex="-1">
      <button
        type="button"
        class="topic-trigger"
        :aria-expanded="isExpanded(topic.id)"
        :aria-controls="`topic-body-${topic.id}`"
        @click="toggle(topic.id)"
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
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  topics: { type: Array, required: true },
  defaultExpandedId: { type: String, default: '' }
})

const expandedTopicIds = ref([])

watch(() => props.defaultExpandedId, (topicId) => {
  expandedTopicIds.value = topicId ? [topicId] : []
}, { immediate: true })

function isExpanded(topicId) {
  return expandedTopicIds.value.includes(topicId)
}

function toggle(topicId) {
  expandedTopicIds.value = isExpanded(topicId)
    ? expandedTopicIds.value.filter(id => id !== topicId)
    : [...expandedTopicIds.value, topicId]
}

</script>

<style scoped lang="less">
.topic-list { display: grid; gap: 10px; }
.topic-card { overflow: hidden; border: 1px solid var(--border-base); border-radius: 11px; background: var(--bg-primary); outline: none; }
.topic-card:focus-visible { box-shadow: 0 0 0 3px var(--el-color-primary-light-7); }
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
.topic-callout { padding: 10px 12px; border-radius: 7px; background: var(--el-fill-color-light); }
.topic-callout.warning { background: var(--el-color-warning-light-9); }

@media (prefers-reduced-motion: reduce) {
  .topic-trigger .el-icon { transition: none; }
}
</style>
