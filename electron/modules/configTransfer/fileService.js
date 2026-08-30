import { open, rename, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import {
  CONFIG_BUNDLE_MAX_BYTES,
  sanitizeConfigFileName
} from '../../../shared/configTransfer.js'

const CONFIG_FILTERS = [{ name: '流放助手配置', extensions: ['json'] }]

function knownFailure(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export function assertConfigTransferMainWindowSender(event, getMainWindow) {
  const mainWindow = getMainWindow?.()
  if (!mainWindow || mainWindow.isDestroyed() || event?.sender !== mainWindow.webContents) {
    throw knownFailure('CONFIG_TRANSFER_FORBIDDEN', '配置导入导出只允许主窗口调用')
  }
  return mainWindow
}

export function configTransferFailure(error, fallbackCode) {
  const messages = {
    CONFIG_TRANSFER_FORBIDDEN: '配置导入导出只允许主窗口调用',
    CONFIG_FILE_TOO_LARGE: '配置文件超过 5 MiB 限制',
    CONFIG_FILE_NOT_REGULAR: '请选择普通 JSON 文件',
    CONFIG_FILE_EXTENSION_INVALID: '请选择 .json 配置文件',
    CONFIG_FILE_ENCODING_INVALID: '配置文件必须使用 UTF-8 编码',
    CONFIG_SAVE_CONTENT_INVALID: '待保存的配置内容无效',
    CONFIG_SAVE_TARGET_INVALID: '保存目标无效'
  }
  const errorCode = messages[error?.code] ? error.code : fallbackCode
  return {
    success: false,
    canceled: false,
    errorCode,
    error: messages[errorCode] || (fallbackCode === 'CONFIG_OPEN_FAILED' ? '打开配置文件失败' : '保存配置文件失败')
  }
}

async function readLimitedUtf8(filePath, maxBytes = CONFIG_BUNDLE_MAX_BYTES) {
  const handle = await open(filePath, 'r')
  try {
    const stats = await handle.stat()
    if (!stats.isFile()) throw knownFailure('CONFIG_FILE_NOT_REGULAR', '请选择普通 JSON 文件')
    if (stats.size > maxBytes) throw knownFailure('CONFIG_FILE_TOO_LARGE', '配置文件超过 5 MiB 限制')
    const buffer = Buffer.alloc(maxBytes + 1)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    if (bytesRead > maxBytes) throw knownFailure('CONFIG_FILE_TOO_LARGE', '配置文件超过 5 MiB 限制')
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead))
    } catch {
      throw knownFailure('CONFIG_FILE_ENCODING_INVALID', '配置文件必须使用 UTF-8 编码')
    }
  } finally {
    await handle.close()
  }
}

export async function openConfigTransferFile({ event, getMainWindow, showOpenDialog }) {
  try {
    const owner = assertConfigTransferMainWindowSender(event, getMainWindow)
    const result = await showOpenDialog(owner, {
      title: '导入流放助手配置',
      properties: ['openFile'],
      filters: CONFIG_FILTERS
    })
    if (result?.canceled) return { success: true, canceled: true, fileName: '', content: '' }
    const filePath = result?.filePaths?.[0]
    if (!filePath) throw knownFailure('CONFIG_FILE_NOT_REGULAR', '请选择普通 JSON 文件')
    if (path.extname(filePath).toLowerCase() !== '.json') {
      throw knownFailure('CONFIG_FILE_EXTENSION_INVALID', '请选择 .json 配置文件')
    }
    const content = await readLimitedUtf8(filePath)
    return { success: true, canceled: false, fileName: path.basename(filePath), content }
  } catch (error) {
    return configTransferFailure(error, 'CONFIG_OPEN_FAILED')
  }
}

export async function saveConfigTransferFile({ event, getMainWindow, showSaveDialog, payload }) {
  let temporaryPath = ''
  try {
    const owner = assertConfigTransferMainWindowSender(event, getMainWindow)
    if (typeof payload?.content !== 'string') {
      throw knownFailure('CONFIG_SAVE_CONTENT_INVALID', '待保存的配置内容无效')
    }
    const bytes = Buffer.byteLength(payload.content, 'utf8')
    if (bytes > CONFIG_BUNDLE_MAX_BYTES) {
      throw knownFailure('CONFIG_FILE_TOO_LARGE', '配置文件超过 5 MiB 限制')
    }
    const result = await showSaveDialog(owner, {
      title: '导出流放助手配置',
      defaultPath: sanitizeConfigFileName(payload.suggestedName),
      filters: CONFIG_FILTERS
    })
    if (result?.canceled) return { success: true, canceled: true, fileName: '' }
    const selectedPath = result?.filePath
    if (!selectedPath) throw knownFailure('CONFIG_SAVE_TARGET_INVALID', '保存目标无效')
    const targetPath = path.extname(selectedPath).toLowerCase() === '.json' ? selectedPath : `${selectedPath}.json`
    const targetDirectory = path.dirname(targetPath)
    temporaryPath = path.join(targetDirectory, `.${path.basename(targetPath)}.${randomUUID()}.tmp`)
    await writeFile(temporaryPath, payload.content, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, targetPath)
    temporaryPath = ''
    return { success: true, canceled: false, fileName: path.basename(targetPath) }
  } catch (error) {
    if (temporaryPath) await unlink(temporaryPath).catch(() => {})
    return configTransferFailure(error, 'CONFIG_SAVE_FAILED')
  }
}
