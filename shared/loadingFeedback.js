import { FAUSTUS_STAGE_LABELS } from './faustusStages.js'

export const LOADING_FEEDBACK_CHANNEL = 'loading-feedback-state'

const operation = (target, label, priority = 0, stages = {}) => Object.freeze({
  target,
  label,
  priority,
  showDelayMs: 300,
  minimumVisibleMs: 400,
  stages: Object.freeze({ ...stages })
})

export const LOADING_FEEDBACK_OPERATIONS = Object.freeze({
  'crafting.initialize': Object.freeze({
    ...operation('app', '正在加载制作模拟数据', 10, {
      bases: '正在加载底材数据'
    }),
    renderer: true
  }),
  'stash-pickup.preview': operation('game', '正在准备仓库取件预览', 20, { model: '正在加载仓库识别模型' }),
  'stash-pickup.start': operation('game', '正在准备仓库自动取件', 30, { model: '正在加载仓库识别模型' }),
  'junfeng.preview': operation('game', '正在准备君锋镇检测预览', 20, { model: '正在加载君锋镇识别模型' }),
  'junfeng.start': operation('game', '正在准备君锋镇自动取件', 30, { model: '正在加载君锋镇识别模型' }),
  'batch-inventory.scan': operation('game', '正在准备背包批量扫描', 30, { model: '正在加载背包识别模型' }),
  'faustus.start': operation('game', '正在准备改价', 40, FAUSTUS_STAGE_LABELS),
  'puzzle.analysis': operation('game', '正在加载海图识别组件', 30),
  'puzzle.border': operation('game', '正在加载边缘词缀识别组件', 30)
})

export function loadingFeedbackOperation(operationId) {
  return LOADING_FEEDBACK_OPERATIONS[String(operationId || '')] || null
}

export function emptyLoadingFeedbackSnapshot(target) {
  return Object.freeze({
    visible: false,
    target: target === 'game' ? 'game' : 'app',
    label: '',
    current: 0,
    total: 0,
    activeCount: 0
  })
}
