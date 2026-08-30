import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  isSafeReleaseNotesUrl,
  parseReleaseNotesMarkdown
} from '../src/utils/releaseNotesMarkdown.js'

function inlineText(nodes = []) {
  return nodes.map(node => node.value || '').join('')
}

test('发布说明解析常用块级与行内 Markdown', () => {
  const blocks = parseReleaseNotesMarkdown([
    '# 版本标题',
    '',
    '包含 **粗体**、*斜体*、`code` 和 [文档](https://example.com/docs)。',
    '',
    '- 第一项',
    '- 第二项',
    '',
    '3. 第三项',
    '4. 第四项'
  ].join('\n'))

  assert.equal(blocks[0].type, 'heading')
  assert.equal(blocks[0].level, 1)
  assert.equal(inlineText(blocks[0].children), '版本标题')
  assert.deepEqual(blocks[1].children.map(node => node.type), [
    'text', 'strong', 'text', 'emphasis', 'text', 'code', 'text', 'link', 'text'
  ])
  assert.equal(blocks[1].children[7].href, 'https://example.com/docs')
  assert.deepEqual(blocks[2], {
    type: 'list',
    ordered: false,
    items: [
      [{ type: 'text', value: '第一项' }],
      [{ type: 'text', value: '第二项' }]
    ]
  })
  assert.equal(blocks[3].type, 'list')
  assert.equal(blocks[3].ordered, true)
  assert.equal(blocks[3].start, 3)
  assert.equal(blocks[3].items.length, 2)
})

test('实际 1.2.2 发布说明保留标题和列表层级', () => {
  const releaseNotes = readFileSync(new URL('../docs/release-notes/v1.2.2.md', import.meta.url), 'utf8')
  const blocks = parseReleaseNotesMarkdown(releaseNotes)
  assert.equal(blocks[0].type, 'heading')
  assert.equal(blocks[0].level, 1)
  assert.ok(blocks.filter(block => block.type === 'heading' && block.level === 2).length >= 5)
  assert.ok(blocks.filter(block => block.type === 'list').length >= 5)
  assert.match(JSON.stringify(blocks), /反馈与通知/)
  assert.match(JSON.stringify(blocks), /稳定性/)
})

test('畸形与不支持语法保留可读原文', () => {
  const source = '###没有空格\n未闭合 **粗体\n> 引用保留\n```js'
  const blocks = parseReleaseNotesMarkdown(source)
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].type, 'paragraph')
  assert.equal(inlineText(blocks[0].children), source)
})

test('原始 HTML 和危险链接只能降级为文字', () => {
  const source = '<img src=x onerror="alert(1)"> [安全](https://example.com) [脚本](javascript:evil) [文件](file:///tmp/a) [数据](data:text/html,x)'
  const blocks = parseReleaseNotesMarkdown(source)
  const nodes = blocks[0].children
  assert.equal(nodes.filter(node => node.type === 'link').length, 1)
  assert.equal(nodes.find(node => node.type === 'link').href, 'https://example.com')
  assert.match(inlineText(nodes), /<img src=x onerror="alert\(1\)">/)
  assert.match(inlineText(nodes), /脚本/)
  assert.equal(JSON.stringify(blocks).includes('innerHTML'), false)
})

test('发布说明链接仅允许 HTTP(S) 绝对地址', () => {
  assert.equal(isSafeReleaseNotesUrl('https://example.com/a'), true)
  assert.equal(isSafeReleaseNotesUrl('http://example.com'), true)
  assert.equal(isSafeReleaseNotesUrl('javascript:alert(1)'), false)
  assert.equal(isSafeReleaseNotesUrl('data:text/html,x'), false)
  assert.equal(isSafeReleaseNotesUrl('file:///tmp/a'), false)
  assert.equal(isSafeReleaseNotesUrl('/relative'), false)
  assert.equal(isSafeReleaseNotesUrl('not a url'), false)
})
