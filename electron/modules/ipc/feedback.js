import { BrowserWindow, dialog, ipcMain } from 'electron'
import { submitFeedbackWithDiagnostics } from '../feedback/submission.js'

const ATTACHMENT_FILTERS = [
  { name: '支持的附件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'log', 'json', 'md', 'pdf', 'doc', 'docx', 'zip', '7z', 'rar'] }
]

function safeFailure(error) {
  return {
    success: false,
    error: error?.message || '附件选择失败，请重试',
    errorCode: error?.code || 'FEEDBACK_ATTACHMENT_PICK_FAILED'
  }
}

function assertMainWindowSender(event, getMainWindow) {
  const mainWindow = getMainWindow?.()
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw new Error('反馈操作只允许主窗口调用')
  }
}

export function registerFeedbackHandlers(feedback, { buildDiagnostics, diagnostics, getMainWindow } = {}) {
  if (!feedback) return
  const guarded = handler => async (event, ...args) => {
    assertMainWindowSender(event, getMainWindow)
    return handler(event, ...args)
  }

  ipcMain.handle('feedback:pick-attachments', guarded(async (event) => {
    try {
      const owner = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: '选择反馈附件',
        properties: ['openFile', 'multiSelections'],
        filters: ATTACHMENT_FILTERS
      }
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
      if (result.canceled) return { success: true, canceled: true, attachments: [] }
      const attachments = await feedback.registerAttachments(result.filePaths)
      return { success: true, canceled: false, attachments }
    } catch (error) {
      return safeFailure(error)
    }
  }))

  ipcMain.handle('feedback:submit', guarded(async (event, input) => {
    return submitFeedbackWithDiagnostics({
      feedback,
      input,
      buildDiagnostics,
      diagnostics,
      onProgress: progress => {
        if (!event.sender.isDestroyed()) event.sender.send('feedback:progress', progress)
      }
    })
  }))

  ipcMain.handle('feedback:puzzle-evidence-summary', guarded(async () => feedback.getPuzzleEvidenceSummary()))
  ipcMain.handle('feedback:puzzle-evidence-discard', guarded(async (_event, referenceId) => feedback.discardPuzzleEvidence(referenceId)))

  ipcMain.handle('feedback:list', guarded(async () => feedback.listConversations()))
  ipcMain.handle('feedback:conversation', guarded(async (_event, feedbackId) => feedback.conversation(feedbackId)))
  ipcMain.handle('feedback:reply-pick-attachments', guarded(async (event) => {
    try {
      const owner = BrowserWindow.fromWebContents(event.sender)
      const options = { title: '选择回复附件', properties: ['openFile', 'multiSelections'], filters: ATTACHMENT_FILTERS }
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
      if (result.canceled) return { success: true, canceled: true, attachments: [] }
      return { success: true, canceled: false, attachments: await feedback.registerAttachments(result.filePaths) }
    } catch (error) { return safeFailure(error) }
  }))
  ipcMain.handle('feedback:reply', guarded(async (event, input) => feedback.reply(input, {
    onProgress: progress => { if (!event.sender.isDestroyed()) event.sender.send('feedback:reply-progress', progress) }
  })))
}
