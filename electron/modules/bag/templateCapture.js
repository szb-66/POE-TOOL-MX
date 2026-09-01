import fs from 'fs'
import path from 'path'

export const BAG_TEMPLATE_TARGETS = Object.freeze({
  stashTitle: 'stash_title.png',
  inventoryTitle: 'inventory_title.png',
  junfengRewardTitle: 'junfeng_reward_title.png',
  allflameReceiverTitle: 'allflame_receiver_title.png'
})

export function resolveTemplateFileName(fileName, isPackaged = true) {
  if (isPackaged) return fileName
  const ext = path.extname(fileName)
  return `${path.basename(fileName, ext)}.dev${ext}`
}

export function assertBagTemplateTarget(type, isPackaged = true) {
  const fileName = BAG_TEMPLATE_TARGETS[type]
  if (!fileName) throw new Error('不支持的模板目标')
  return resolveTemplateFileName(fileName, isPackaged)
}

export function savePngAtomically(templateDirectory, type, png, fileSystem = fs, isPackaged = true) {
  const fileName = assertBagTemplateTarget(type, isPackaged)
  if (!Buffer.isBuffer(png) || png.length === 0) throw new Error('模板 PNG 数据为空')
  fileSystem.mkdirSync(templateDirectory, { recursive: true })
  const targetPath = path.join(templateDirectory, fileName)
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const temporaryPath = path.join(templateDirectory, `.${fileName}.${token}.tmp`)
  const backupPath = path.join(templateDirectory, `.${fileName}.${token}.bak`)
  let backedUp = false
  let replaced = false
  try {
    fileSystem.writeFileSync(temporaryPath, png, { flag: 'wx' })
    if (fileSystem.existsSync(targetPath)) {
      fileSystem.copyFileSync(targetPath, backupPath)
      backedUp = true
    }
    fileSystem.renameSync(temporaryPath, targetPath)
    replaced = true
    if (backedUp) {
      try { fileSystem.unlinkSync(backupPath) } catch {}
    }
    return targetPath
  } catch (error) {
    try { if (fileSystem.existsSync(temporaryPath)) fileSystem.unlinkSync(temporaryPath) } catch {}
    try {
      if (replaced && backedUp && fileSystem.existsSync(backupPath)) {
        fileSystem.copyFileSync(backupPath, targetPath)
      }
      if (fileSystem.existsSync(backupPath)) fileSystem.unlinkSync(backupPath)
    } catch {}
    throw error
  }
}
