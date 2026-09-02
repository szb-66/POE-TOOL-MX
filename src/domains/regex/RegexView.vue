<template>
  <div class="regex-page primary-page primary-page--column">
    <div class="primary-page__tabs">
      <el-tabs v-model="activeTab" class="regex-tabs">
        <el-tab-pane label="商城" name="vendor" />
        <el-tab-pane label="地图" name="map" />
      </el-tabs>
    </div>
    <div class="primary-page__scroll primary-page__content">
      <el-row class="app-grid" :gutter="16"><el-col :span="24">
        <VendorRegexPanel v-if="activeTab === 'vendor'" />
        <MapRegexPanel v-else />
      </el-col></el-row>
    </div>
    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { readPersistentTab, writePersistentTab } from '@/utils/tabPersistence.js'
import MapRegexPanel from './MapRegexPanel.vue'
import VendorRegexPanel from './VendorRegexPanel.vue'

const TABS = ['vendor', 'map']
const activeTab = ref(readPersistentTab('regexActiveTab', TABS, 'vendor'))
const helpTopics = moduleHelpTopicsById('regex')
watch(activeTab, value => { activeTab.value = writePersistentTab('regexActiveTab', value, TABS, 'vendor') })
</script>

<style scoped lang="less">
.regex-tabs { width: 100%; }
</style>
