import { classifyArea } from '../../../shared/mapTrackerAreaCatalog.js'

function logTime(line) {
  const match = String(line).match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/)
  return match ? match[1] : null
}

export function mapTierFromAreaLevel(level) {
  const value = Number(level) - 67
  return Number.isInteger(value) && value >= 1 && value <= 17 ? value : null
}

export function parseClientLogLine(line) {
  const text = String(line || '')
  const timestamp = logTime(text)
  // Anchor to the system message body: player chat may quote these exact words.
  const system = text.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} .*?\[(?:INFO|DEBUG) Client(?: \d+)?\]\s+(.*)$/)?.[1]
  if (system?.startsWith('Abnormal disconnect:')) return { type: 'game-state', logTime: timestamp, state: 'disconnected', reason: 'disconnect' }
  if (system?.startsWith('Connecting to instance server at ')) return { type: 'game-state', logTime: timestamp, state: 'loading', reason: 'area-loading' }
  if (/^:\s*(?:你已进入[：:]|你已進入[：:]|You have entered\b)/.test(system || '')) return { type: 'game-state', logTime: timestamp, state: 'in-game', reason: 'area-ready' }
  if (!system) return null
  const area = system.match(/^Generating level\s+(\d+)\s+area\s+"([^"]+)"(?:\s+with seed\s+(\d+))?/i)
  if (area) {
    const areaLevel = Number(area[1])
    return {
      type: 'area-entered', logTime: timestamp, areaId: area[2], loading: true,
      seed: area[3] || null, areaLevel, mapTier: classifyArea(area[2]).type === 'map' ? mapTierFromAreaLevel(areaLevel) : null
    }
  }
  const message = system.replace(/^:\s*/, '')
  // Chat uses a channel prefix or speaker delimiter; never search inside it.
  if (/^[#%@&$]|[:：]/.test(message)) return null
  const level = message.match(/^(?:\S+ has leveled up to level|\S+\s*(?:升至|升到了?等级|角色等级(?:提升)?至))\s*(\d+)[.!。]?$/i)
  if (level) return { type: 'character-level', logTime: timestamp, level: Number(level[1]) }
  if (/^(?:\S+ has been slain|You have died|你已死亡|\S+被击败了)[.!。]?$/i.test(message)) return { type: 'player-death', logTime: timestamp }
  return null
}
