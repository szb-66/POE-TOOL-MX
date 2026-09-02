<template>
  <div class="recipe-page primary-page primary-page--column">
    <div class="primary-page__scroll primary-page__content"><el-row class="app-grid" :gutter="16"><el-col :span="24"><ChaosRecipePanel /></el-col></el-row></div>
    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import ChaosRecipePanel from './ChaosRecipePanel.vue'
const helpTopics = moduleHelpTopicsById('recipe')
</script>
