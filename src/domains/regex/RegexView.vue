<template>
  <div class="regex-page primary-page primary-page--column">
    <div class="primary-page__tabs">
      <el-tabs v-model="activeTab" class="regex-tabs">
        <el-tab-pane label="商城" name="vendor" />
        <el-tab-pane label="地图" name="map" />
        <el-tab-pane label="野兽" name="beast" />
      </el-tabs>
    </div>
    <div class="primary-page__scroll primary-page__content">
      <el-alert v-if="international" title="国际服商店、地图与野兽正则使用英文词库，仅复制文本。地图与红兽／首领词库对应 3.30；请在英文客户端中核对匹配结果。" type="info" :closable="false" />
      <el-row class="app-grid" :gutter="16"><el-col :span="24">
        <VendorRegexPanel v-if="activeTab === 'vendor'" />
        <MapRegexPanel v-else-if="activeTab === 'map'" />
        <BeastRegexPanel v-else />
      </el-col></el-row>
    </div>
    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { currentServer } from '../../utils/serverContext.js'
const international = currentServer.id === 'international'
import { ref, watch } from 'vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { readPersistentTab, writePersistentTab } from '@/utils/tabPersistence.js'
import BeastRegexPanel from './BeastRegexPanel.vue'
import MapRegexPanel from './MapRegexPanel.vue'
import VendorRegexPanel from './VendorRegexPanel.vue'

const TABS = ['vendor', 'map', 'beast']
const activeTab = ref(readPersistentTab('regexActiveTab', TABS, 'vendor'))
const helpTopics = moduleHelpTopicsById('regex')
watch(activeTab, value => { activeTab.value = writePersistentTab('regexActiveTab', value, TABS, 'vendor') })
</script>

<style scoped lang="less">
.regex-tabs { width: 100%; }
</style>
