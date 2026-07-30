/**
 * Purpose: 解析制作脚本通过标准输出发送的结构化事件。
 * Inputs: 单行标准输出文本。
 * Outputs: 事件对象或 null。
 */
export function parseScriptEventLine(line) {
  const text = String(line || '').trim()
  if (!text.startsWith('EVENT ')) return null
  try {
    const event = JSON.parse(text.slice(6))
    return event && typeof event.event === 'string' ? event : null
  } catch {
    return null
  }
}
