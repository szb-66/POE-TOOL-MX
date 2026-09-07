import { classifyArea } from './mapTrackerAreaCatalog.js'

const classes = Object.freeze({
  Marauder: '野蛮人', Ranger: '游侠', Witch: '女巫', Duelist: '决斗者',
  Templar: '圣堂武僧', Shadow: '暗影', Scion: '贵族',
  Juggernaut: '勇士', Berserker: '暴徒', Chieftain: '酋长',
  Deadeye: '锐眼', Raider: '侠客', Pathfinder: '追猎者', Warden: '守望者',
  Necromancer: '召唤师', Elementalist: '元素使', Occultist: '秘术家',
  Slayer: '处刑者', Gladiator: '卫士', Champion: '冠军',
  Inquisitor: '判官', Hierophant: '圣宗', Guardian: '守护者',
  Assassin: '刺客', Saboteur: '破坏者', Trickster: '欺诈师', Ascendant: '升华使徒'
})

export function classLabel(value) {
  const name = String(value || '').trim()
  return classes[name] || (/\p{Script=Han}/u.test(name) ? name : name ? '流放者' : '')
}

export function mapLabel(value) {
  const name = String(value || '').trim()
  if (name === '监守高塔') return '狱卒之塔'
  if (!name || /\p{Script=Han}/u.test(name)) return name
  const area = classifyArea(name)
  if (area.supported) return area.areaName
  return classifyArea(`MapWorlds${name.replace(/\s+/g, '')}`).areaName
}
