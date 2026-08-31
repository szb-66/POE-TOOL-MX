<template>
  <el-button
    class="page-help-fab"
    type="primary"
    circle
    aria-label="打开本页帮助"
    @click="open()"
  >
    <el-icon><QuestionFilled /></el-icon>
  </el-button>
  <el-drawer v-model="visible" :title="title || '本页帮助'" size="460px" class="page-help-drawer">
    <HelpTopicList
      :key="targetOpenVersion"
      :topics="visibleTopics"
      :default-expanded-id="defaultExpandedId"
    />
  </el-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import HelpTopicList from './HelpTopicList.vue'

const props = defineProps({
  topics: { type: Array, required: true },
  title: { type: String, default: '' }
})

const visible = ref(false)
const requestedTopicId = ref('')
const targetOpenVersion = ref(0)
const visibleTopics = computed(() => {
  if (!requestedTopicId.value) return props.topics
  const target = props.topics.find(topic => topic.id === requestedTopicId.value)
  return target ? [target, ...props.topics.filter(topic => topic.id !== target.id)] : props.topics
})
// 每次打开都重建主题列表：定向入口展开目标，普通入口恢复规范默认状态。
const defaultExpandedId = computed(() => (
  requestedTopicId.value || (props.topics.length === 1 ? props.topics[0].id : '')
))

function open(topicId = '') {
  requestedTopicId.value = props.topics.some(topic => topic.id === topicId) ? topicId : ''
  targetOpenVersion.value += 1
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped lang="less">
.page-help-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 100;
  width: 40px;
  height: 40px;
  box-shadow: var(--el-box-shadow-light);
}
</style>
