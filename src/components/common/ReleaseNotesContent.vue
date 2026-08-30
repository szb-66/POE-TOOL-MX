<template>
  <div class="release-notes-content">
    <template v-for="(block, blockIndex) in blocks" :key="blockIndex">
      <component :is="`h${block.level}`" v-if="block.type === 'heading'">
        <InlineContent :nodes="block.children" />
      </component>
      <p v-else-if="block.type === 'paragraph'">
        <InlineContent :nodes="block.children" />
      </p>
      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        :start="block.ordered ? block.start : undefined"
      >
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <InlineContent :nodes="item" />
        </li>
      </component>
    </template>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { parseReleaseNotesMarkdown } from '@/utils/releaseNotesMarkdown.js'

const props = defineProps({
  source: {
    type: String,
    default: ''
  }
})

const blocks = computed(() => parseReleaseNotesMarkdown(props.source))

const InlineContent = (inlineProps) => inlineProps.nodes.map((node, index) => {
  if (node.type === 'strong') return h('strong', { key: index }, node.value)
  if (node.type === 'emphasis') return h('em', { key: index }, node.value)
  if (node.type === 'code') return h('code', { key: index }, node.value)
  if (node.type === 'link') {
    return h('a', {
      key: index,
      href: node.href,
      target: '_blank',
      rel: 'noopener noreferrer'
    }, node.value)
  }
  return node.value
})
InlineContent.props = {
  nodes: {
    type: Array,
    default: () => []
  }
}
</script>

<style scoped lang="less">
.release-notes-content {
  min-width: 0;
  color: inherit;
  line-height: 1.65;
  overflow-wrap: anywhere;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1em 0 .45em;
    color: var(--text-primary, var(--el-text-color-primary));
    font-weight: 650;
    line-height: 1.35;

    &:first-child { margin-top: 0; }
  }

  h1 { font-size: 1.35em; }
  h2 { font-size: 1.2em; }
  h3 { font-size: 1.1em; }
  h4,
  h5,
  h6 { font-size: 1em; }

  p {
    margin: .5em 0;
    white-space: pre-wrap;
  }

  ul,
  ol {
    margin: .5em 0;
    padding-left: 1.6em;
  }

  li + li { margin-top: .25em; }

  strong { color: var(--text-primary, var(--el-text-color-primary)); }

  code {
    padding: .1em .35em;
    border: 1px solid var(--border-base, var(--el-border-color));
    border-radius: 4px;
    background: var(--bg-tertiary, var(--el-fill-color-light));
    color: inherit;
    font-family: Consolas, 'Cascadia Mono', monospace;
    font-size: .92em;
  }

  a {
    color: var(--brand-color, var(--el-color-primary));
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}
</style>
