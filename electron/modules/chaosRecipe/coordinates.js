import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'
import { resolveStashGridLayout } from './layout.js'

export function normalizeGridRegion(region) {
  const left = Number(region?.left)
  const top = Number(region?.top)
  const right = Number(region?.right)
  const bottom = Number(region?.bottom)
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null
  return { left, top, right, bottom }
}

export function itemGridBounds(item, regionInput, columns) {
  const region = normalizeGridRegion(regionInput)
  const size = Number(columns)
  if (!region || ![12, 24].includes(size)) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.CALIBRATION_REQUIRED, '缺少当前仓库布局的网格校准')
  }
  const cellWidth = (region.right - region.left) / size
  const cellHeight = (region.bottom - region.top) / size
  return {
    x: region.left + Number(item.x) * cellWidth,
    y: region.top + Number(item.y) * cellHeight,
    width: Math.max(1, Number(item.width) || 1) * cellWidth,
    height: Math.max(1, Number(item.height) || 1) * cellHeight,
    clickX: Math.round(region.left + (Number(item.x) + Math.max(1, Number(item.width) || 1) / 2) * cellWidth),
    clickY: Math.round(region.top + (Number(item.y) + Math.max(1, Number(item.height) || 1) / 2) * cellHeight)
  }
}

export function enrichPlanCoordinates(plan, calibration = {}) {
  return {
    ...plan,
    tabs: plan.tabs.map((tab) => {
      const { calibrationKey, columns, region } = resolveStashGridLayout(tab, calibration)
      return {
        ...tab,
        calibrationKey,
        columns,
        items: tab.items.map((item) => ({
          ...item,
          screen: itemGridBounds(item, region, columns)
        }))
      }
    })
  }
}
