<template>
  <el-button
    class="page-help-fab"
    type="primary"
    circle
    aria-label="打开本页帮助"
    @click="visible = true"
  >
    <el-icon><QuestionFilled /></el-icon>
  </el-button>
  <el-drawer v-model="visible" :title="title || '本页帮助'" size="460px" class="page-help-drawer">
    <HelpTopicList :topics="topics" :default-expanded-id="defaultExpandedId" />
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
// ponytail: 仅做“单主题默认展开”，多主题记住展开状态到抽屉关闭为止
const defaultExpandedId = computed(() => (props.topics.length === 1 ? props.topics[0].id : ''))
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
