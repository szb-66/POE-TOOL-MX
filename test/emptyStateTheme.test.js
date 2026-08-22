import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const elementOverrides = readFileSync(new URL('../src/styles/element-override.less', import.meta.url), 'utf8')

test('深色主题覆盖缺省空状态插图的全部十级填充色', () => {
  const darkThemeStart = elementOverrides.indexOf('html.app-dark-theme')
  const emptyBlock = elementOverrides.slice(darkThemeStart).match(/\.el-empty\s*\{([\s\S]*?)\n\s*\}/)?.[1] || ''

  for (let index = 0; index <= 9; index += 1) {
    const match = emptyBlock.match(new RegExp(`--el-empty-fill-color-${index}:\\s*(#[0-9A-Fa-f]{6})`))
    assert.ok(match, `缺少空状态插图填充色 ${index}`)
    const channels = match[1].match(/[0-9a-f]{2}/gi).map(value => Number.parseInt(value, 16))
    assert.ok(Math.max(...channels) <= 90, `空状态插图填充色 ${index} 仍然过亮`)
  }

  assert.doesNotMatch(emptyBlock, /var\(--el-color-white\)|#(?:fff|ffffff)\b/i)
})
