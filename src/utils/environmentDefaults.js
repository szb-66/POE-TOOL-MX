import { EMPTY_SLOT_THRESHOLD } from './inventorySettings.js'

export const CURRENCY_POSITION_KEYS = Object.freeze([
  'alteration', 'augmentation', 'regal', 'chaos', 'exalted', 'alchemy', 'scouring',
  'transmutation', 'jewellers', 'fusing', 'chromic', 'vaal', 'wisdom',
  'lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember',
  'exceptional-eldritch-ember', 'lesser-eldritch-ichor', 'greater-eldritch-ichor',
  'grand-eldritch-ichor', 'exceptional-eldritch-ichor'
])

export function createEmptyCurrencyPositions() {
  return Object.fromEntries(CURRENCY_POSITION_KEYS.map(key => [key, { x: 0, y: 0 }]))
}

export function createDefaultInventorySettings() {
  return {
    startPos: { x: 0, y: 0 },
    slotSize: { w: 0, h: 0 },
    emptySlotThreshold: EMPTY_SLOT_THRESHOLD.default
  }
}

export function createEmptyItemPosition() {
  return { x: 0, y: 0 }
}
