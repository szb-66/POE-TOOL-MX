import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

// 官方可能返回长的编码查询；编号是不透明字符串，不限制其字符集或长度。
export function encodeTradeQueryId(queryId) {
  if (typeof queryId === 'string' && queryId.trim()) {
    try { return encodeURIComponent(queryId) } catch { /* 无法编码的字符串属于异常响应。 */ }
  }
  throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服交易响应缺少查询编号或编号无效')
}
