import { createSanctumStrategy } from '../../../shared/sanctum.js'
import { planPracticalFloor } from './practicalPlanner.js'

export function planSanctumFloor(floor, strategy = createSanctumStrategy(), marks = {}, currentEffects = [], context = {}) {
  return planPracticalFloor(floor, strategy, marks, currentEffects, context)
}
