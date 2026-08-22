export const CHART_REGION_ALIASES_VERSION = 'S30-2026-08-20'

export const CHART_REGION_ALIASES = Object.freeze([
  ['AbyssalPlain', '深渊平原', []],
  ['Anchorfield', '锚地', []],
  ['BrineKingsDomain', '惊海之王的领域', ['海王领域']],
  ['ClamInfestedShelf', '巨蛤礁岸', []],
  ['DivingShoals', '浅滩海域', []],
  ['EldritchDepths', '古灵深渊', []],
  ['HazardousDepths', '危险深渊', []],
  ['InfestedBathyspheres', '被感染的潜航球', []],
  ['KisharasRest', '琪莎拉之息', []],
  ['LostRuins', '失落遗迹', []],
  ['PelagicAbyss', '远洋深渊', []],
  ['SeafloorRidges', '海床山脊', ['海底山脊']],
  ['SeaPillars', '海上石柱', []],
  ['SunkenTotems', '沉没图腾', []],
  ['UnderseaGroves', '海底庄园', ['海底林地']],
  ['UnremarkableSeabed', '平庸海床', []]
].map(([type, displayName, aliases]) => Object.freeze({
  type,
  displayName,
  aliases: Object.freeze([...new Set([displayName, ...aliases])])
})))

export const CHART_BASE_TYPES = Object.freeze(['金沙海床海图', '珊瑚密林海图', '珊瑚暗礁海图'])

export const CHART_SHAPE_ALIASES_VERSION = 'S30-cn-game-and-trade-2026-08-20'

// 游戏复制文本与腾讯市集过滤目录使用两套中文文案。两套五类形状都显式保留，
// 避免把市集标签误当成游戏内唯一译名后，只能逐个修补识别失败。
const shape = (id, gameLabel, tradeLabel) => Object.freeze({
  id,
  label: gameLabel,
  gameLabel,
  tradeLabel,
  aliases: Object.freeze([...new Set([gameLabel, tradeLabel])])
})

export const CHART_SHAPES = Object.freeze([
  shape('1', '端点', '结束'),
  shape('2', '角落', '角落'),
  shape('3', '直线', '直线'),
  shape('4', '节点', '交汇'),
  shape('5', '交叉', '岔路')
])

const normalized = (value) => String(value || '').normalize('NFKC').replace(/\s+/g, '').trim()

export function resolveChartShape(value) {
  const key = normalized(value)
  return CHART_SHAPES.find((shape) => shape.aliases.some((alias) => normalized(alias) === key)) || null
}

export function chartRegionByType(value) {
  const key = String(value || '').trim()
  return CHART_REGION_ALIASES.find((region) => region.type === key) || null
}
