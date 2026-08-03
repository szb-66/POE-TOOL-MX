import { naturalSocketLimit, rollSocketColor, singletonLinks } from './equipmentPropertyRules.js'
import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const TAINTED_RULESET = Object.freeze({ game: SEASON_BASELINE.game, patch: SEASON_BASELINE.patch, locale: SEASON_BASELINE.locale })
export const TAINTED_SOCKET_MODEL_VERSION = `${SEASON_BASELINE.game}-${SEASON_BASELINE.patch}-tainted-sockets-v1`

export const TAINTED_CURRENCIES = Object.freeze([
  { id: 'currency:tainted-chromatic', name: '污秽幻色石', supportLevel: 'supported', effect: '忽略装备属性需求，重铸腐化装备全部插槽颜色。', requirements: '已腐化、未镜像且至少有一个插槽的装备', consequences: '每个插槽独立等概率成为红、绿或蓝；孔数和连接不变' },
  { id: 'currency:tainted-jewellers', name: '污秽工匠石', supportLevel: 'supported', effect: '不可预测地增加或移除腐化装备的一个插槽。', requirements: '已腐化、未镜像且可打孔的装备', consequences: '增减各 50%；自然边界只保留合法方向；增加仍遵守物品等级孔数上限' },
  { id: 'currency:tainted-fusing', name: '污秽链结石', supportLevel: 'supported', effect: '不可预测地增加或移除最大连接组的一条连接。', requirements: '已腐化、未镜像且至少有两个插槽的装备', consequences: '增减各 50%；连接边界只保留合法方向；孔数和孔色不变' },
  { id: 'currency:tainted-armourers-scrap', name: '污秽护甲片', supportLevel: 'known-effect-unknown-odds', effect: '随机化腐化护甲的品质，当前版本最高 20%。', unsupportedReason: '公开资料没有可审计的 0–20% 精确结果分布，暂不伪造随机品质' },
  { id: 'currency:tainted-blacksmith-whetstone', name: '污秽磨刀石', supportLevel: 'known-effect-unknown-odds', effect: '随机化腐化武器的品质，当前版本最高 20%。', unsupportedReason: '公开资料没有可审计的 0–20% 精确结果分布，暂不伪造随机品质' },
  { id: 'currency:tainted-exalted', name: '污秽崇高石', supportLevel: 'known-effect-unknown-odds', effect: '不可预测地为腐化稀有物品增加或移除一条词缀。', unsupportedReason: '当前可靠资料未给出增删结果的精确权重，暂不伪造概率' },
  { id: 'currency:tainted-chaos', name: '污秽混沌石', supportLevel: 'known-effect-unknown-odds', effect: '不可预测地重铸腐化稀有物品，或移除全部可移除词缀并降低稀有度。', unsupportedReason: '当前可靠资料未给出重铸与清空结果的精确权重，暂不伪造概率' },
  { id: 'currency:tainted-divine-teardrop', name: '污染神泪', supportLevel: 'known-effect-unknown-odds', effect: '不可预测地提高或降低腐化稀有物品上每条可用词缀的阶级。', unsupportedReason: '各词缀升降权重公式未公开，且工艺词缀与不可自然生成词缀不受影响，暂不伪造结果' },
  { id: 'currency:tainted-mythic', name: '污秽神秘石', supportLevel: 'missing-item-model', effect: '将腐化的普通、魔法或稀有物品转为匹配传奇物品，或摧毁该物品。', unsupportedReason: '当前数据集没有完整的传奇底材、掉落限制和传奇权重，无法准确生成结果' }
])

export function taintedCommonReason({ state }) {
  if (state.mirrored) return '镜像物品不能被修改'
  if (!state.corrupted) return '污秽通货只能用于已腐化物品'
  return ''
}

export function taintedSocketReason(context, kind) {
  const common = taintedCommonReason(context)
  if (common) return common
  const { state, base, request } = context
  if (kind === 'chromatic') return state.sockets.length ? '' : '污秽幻色石要求物品至少有一个插槽'
  if (kind === 'fusing') return state.sockets.length >= 2 ? '' : '污秽链结石要求物品至少有两个插槽'
  const maximum = naturalSocketLimit(base, request.itemLevel)
  if (!maximum) return '该底材不能拥有彩色插槽'
  return ''
}

export function rerollTaintedSocketColours(state, rng = Math.random) {
  const colours = ['R', 'G', 'B']
  state.sockets = state.sockets.map((socket) => ({ ...socket, color: colours[Math.min(2, Math.floor(rng() * 3))] }))
  return state
}

function normalizedLinks(sockets, links) {
  const allowed = new Set(sockets.map((socket) => socket.id))
  const groups = (links ?? []).map((group) => group.filter((id) => allowed.has(id))).filter((group) => group.length)
  const linked = new Set(groups.flat())
  sockets.forEach((socket) => { if (!linked.has(socket.id)) groups.push([socket.id]) })
  return groups.length ? groups : singletonLinks(sockets)
}

export function applyTaintedJewellers(state, base, itemLevel, rng = Math.random) {
  const maximum = naturalSocketLimit(base, itemLevel)
  const count = state.sockets.length
  const add = count <= 1 ? true : count >= maximum ? false : rng() < 0.5
  if (add) {
    state.sockets.push({ id: `socket:${count + 1}`, color: rollSocketColor(base.requirements, rng) })
  } else {
    state.sockets = state.sockets.slice(0, Math.max(1, count - 1))
  }
  state.links = normalizedLinks(state.sockets, state.links)
  return { state, direction: add ? 'add' : 'remove' }
}

export function largestLinkSize(state) {
  return Math.max(1, ...(state.links ?? []).map((group) => group.length))
}

export function applyTaintedFusing(state, rng = Math.random) {
  const count = state.sockets.length
  const current = Math.min(count, largestLinkSize(state))
  const add = current <= 1 ? true : current >= count ? false : rng() < 0.5
  const target = current + (add ? 1 : -1)
  const ids = state.sockets.map((socket) => socket.id)
  state.links = target > 1 ? [ids.slice(0, target), ...ids.slice(target).map((id) => [id])] : ids.map((id) => [id])
  return { state, direction: add ? 'add' : 'remove', target }
}
