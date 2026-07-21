export async function writeTextToClipboard(text, adapters = {}) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError('没有可复制的正则内容')
  }

  if (typeof adapters.electronWrite === 'function') {
    return adapters.electronWrite(text)
  }

  const browserClipboard = adapters.browserClipboard ?? globalThis.navigator?.clipboard
  if (!browserClipboard || typeof browserClipboard.writeText !== 'function') {
    throw new Error('当前环境不支持剪贴板写入')
  }

  await browserClipboard.writeText(text)
  return { success: true }
}
