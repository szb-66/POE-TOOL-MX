<template>
<section class="sanctum-section">
  <h3>截图校准</h3>
  <SanctumCalibrationCollection>
    <SanctumLiveCalibration section="map" :profile="store.state.liveCalibration" :public-titles="store.state.publicTitles" :busy="store.busy || store.readOnly" :action="perform" />
    <SanctumLiveCalibration section="effects" :profile="store.state.liveCalibration" :public-titles="store.state.publicTitles" :busy="store.busy || store.readOnly" :action="perform" />
  </SanctumCalibrationCollection>
</section>
</template>
<script setup>
import { useSanctumActions } from './useSanctumActions.js'
import SanctumLiveCalibration from './SanctumLiveCalibration.vue'
import SanctumCalibrationCollection from './SanctumCalibrationCollection.vue'
const { store, perform } = useSanctumActions()
</script>
<style scoped lang="less">
@import './sanctumSection.less';
</style>
