export function writeClipboardText(text, clipboardApi) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError('剪贴板内容必须是非空文本')
  }
  if (!clipboardApi || typeof clipboardApi.writeText !== 'function') {
    throw new Error('系统剪贴板不可用')
  }
  clipboardApi.writeText(text)
  return { success: true }
}
