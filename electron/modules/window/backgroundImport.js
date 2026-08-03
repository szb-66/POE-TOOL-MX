import fs from 'node:fs'
import path from 'node:path'
import { isSupportedOverlayBackground } from '../../../shared/overlayBackground.js'

export class OverlayBackgroundImportError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'OverlayBackgroundImportError'
    this.code = code
  }
}

export function importOverlayBackground(sourcePath, {
  userDataPath,
  fileSystem = fs,
  now = Date.now
} = {}) {
  const normalizedSource = typeof sourcePath === 'string' ? sourcePath.trim() : ''
  if (!normalizedSource) {
    throw new OverlayBackgroundImportError('BACKGROUND_PATH_REQUIRED', '无法读取拖入文件的本地路径')
  }
  const storageRoot = typeof userDataPath === 'string' ? userDataPath.trim() : ''
  if (!storageRoot || !path.isAbsolute(storageRoot)) {
    throw new OverlayBackgroundImportError('BACKGROUND_STORAGE_UNAVAILABLE', '用户配置目录不可用，未导入背景文件')
  }
  if (!isSupportedOverlayBackground(normalizedSource)) {
    throw new OverlayBackgroundImportError('BACKGROUND_FORMAT_UNSUPPORTED', '不支持该背景格式，请选择图片或视频文件')
  }

  let stats
  try {
    stats = fileSystem.statSync(normalizedSource)
  } catch {
    throw new OverlayBackgroundImportError('BACKGROUND_FILE_UNAVAILABLE', '背景文件不存在或无法读取')
  }
  if (!stats.isFile()) {
    throw new OverlayBackgroundImportError('BACKGROUND_FILE_REQUIRED', '请拖入单个图片或视频文件，不能使用文件夹')
  }

  const backgroundsDir = path.join(storageRoot, 'backgrounds')
  fileSystem.mkdirSync(backgroundsDir, { recursive: true })
  const extension = path.extname(normalizedSource).toLowerCase()
  const baseName = path.basename(normalizedSource, path.extname(normalizedSource)) || 'background'
  const destination = path.join(backgroundsDir, `${baseName}_${now()}${extension}`)

  try {
    fileSystem.copyFileSync(normalizedSource, destination)
  } catch {
    throw new OverlayBackgroundImportError('BACKGROUND_COPY_FAILED', '复制背景文件失败，请检查文件和配置目录权限')
  }

  return { success: true, filePath: destination }
}
