/**
 * Purpose: 为制作与洗图 Python 子进程提供低延迟 stdin/stdout 管道解析桥接。
 * Inputs: stdout 中的 `PARSE_REQ <json>` 请求行与 `map-stats-updated` 事件。
 * Outputs: 向子进程 stdin 写回 `PARSE_RES <json>\n`，并将规范化结果分发至浮窗/主窗口。
 * Preconditions: 子进程以 `stdin: 'pipe'` 启动，并设置 `POE_PARSE_TRANSPORT=pipe`。
 * Edge cases: stdin 关闭或写入失败时静默返回 false；畸形请求返回带 error 字段的响应避免子进程死等。
 */

import { evaluateClipboardItem } from '../item/evaluateClipboardItem.js'

export const PARSE_REQ_PREFIX = 'PARSE_REQ '
export const PARSE_RES_PREFIX = 'PARSE_RES '

export function parsePipeRequestLine(line) {
  const text = String(line || '')
  if (!text.startsWith(PARSE_REQ_PREFIX)) return null
  try {
    const payload = JSON.parse(text.slice(PARSE_REQ_PREFIX.length))
    if (!payload || typeof payload !== 'object') return null
    return {
      clipboard: typeof payload.clipboard === 'string' ? payload.clipboard : '',
      requestId: Number.isSafeInteger(payload.requestId) ? payload.requestId : null
    }
  } catch {
    return { invalid: true, clipboard: '', requestId: null }
  }
}

export function normalizeMapStatsSnapshot(raw = null) {
  if (!raw || typeof raw !== 'object') return null
  return {
    processedCount: Number(raw.processedCount ?? raw.processed_count ?? 0) || 0,
    qualifiedCount: Number(raw.qualifiedCount ?? raw.qualified_count ?? 0) || 0,
    blacklistStats: { ...(raw.blacklistStats || raw.blacklist_stats || {}) },
    whitelistStats: { ...(raw.whitelistStats || raw.whitelist_stats || {}) }
  }
}

export function handlePipeParseRequest({
  line,
  config = null,
  localizationRuntime = null,
  crafting = null,
  mapStats = null,
  writeResponse,
  onResult
} = {}) {
  const request = parsePipeRequestLine(line)
  if (!request) return false
  const evaluated = request.invalid
    ? { result: { error: '管道解析请求格式无效', requestId: null }, notifyOverlay: false }
    : evaluateClipboardItem({
        clipboardText: request.clipboard,
        config,
        requestId: request.requestId,
        localizationRuntime,
        crafting,
        mapStats: normalizeMapStatsSnapshot(mapStats)
      })

  try {
    writeResponse?.(`${PARSE_RES_PREFIX}${JSON.stringify(evaluated.result)}\n`)
  } catch {
    return true
  }
  if (evaluated.notifyOverlay) {
    onResult?.(evaluated.result, config)
  }
  return true
}
