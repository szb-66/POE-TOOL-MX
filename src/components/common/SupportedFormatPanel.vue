<template>
  <section class="format-panel">
    <div class="format-panel__heading">
      <div>
        <h3>{{ guidance.title }}</h3>
        <p>{{ guidance.summary }}</p>
      </div>
      <el-tag type="warning" effect="plain">中文客户端</el-tag>
    </div>

    <div class="format-panel__fields">
      <el-tag v-for="field in guidance.fields" :key="field" effect="plain">{{ field }}</el-tag>
    </div>

    <details class="format-panel__details">
      <summary>查看完整剪贴板示例</summary>
      <div class="format-panel__examples">
        <article v-for="example in guidance.examples" :key="example.id" class="format-panel__example">
          <h4>{{ example.label }}</h4>
          <pre>{{ example.text }}</pre>
        </article>
      </div>
    </details>
  </section>
</template>

<script setup>
defineProps({
  guidance: {
    type: Object,
    required: true
  }
})
</script>

<style scoped lang="less">
.format-panel {
  margin-bottom: 20px;
  padding: 16px 18px;
  border: 1px solid var(--border-base);
  border-left: 3px solid var(--el-color-warning);
  border-radius: 8px;
  background: var(--bg-primary);

  &__heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    h3 {
      margin: 0 0 6px;
      color: var(--text-primary);
      font-size: 16px;
    }

    p {
      margin: 0;
      color: var(--text-regular);
      font-size: 13px;
      line-height: 1.6;
    }
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  &__details {
    margin-top: 14px;

    summary {
      width: fit-content;
      color: var(--el-color-primary);
      font-size: 13px;
      cursor: pointer;
      user-select: none;
    }
  }

  &__examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  &__example {
    min-width: 0;

    h4 {
      margin: 0 0 8px;
      color: var(--text-regular);
      font-size: 13px;
    }

    pre {
      max-height: 320px;
      margin: 0;
      padding: 12px;
      overflow: auto;
      border-radius: 6px;
      background: #111827;
      color: #d1d5db;
      font: 12px/1.6 Consolas, 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}
</style>
