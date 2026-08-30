import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  openConfigTransferFile,
  saveConfigTransferFile
} from '../electron/modules/configTransfer/fileService.js'
import { CONFIG_BUNDLE_MAX_BYTES } from '../shared/configTransfer.js'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function mainWindowContext() {
  const sender = {}
  const mainWindow = { isDestroyed: () => false, webContents: sender }
  return { event: { sender }, getMainWindow: () => mainWindow }
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'poe-config-transfer-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return directory
}

test('config transfer file open handles cancel, validates size and returns no absolute path', async (t) => {
  const directory = await temporaryDirectory(t)
  const filePath = path.join(directory, 'share.json')
  await writeFile(filePath, '{"ok":true}', 'utf8')
  const context = mainWindowContext()

  const canceled = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: true, filePaths: [] })
  })
  assert.deepEqual(canceled, { success: true, canceled: true, fileName: '', content: '' })

  const opened = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [filePath] })
  })
  assert.equal(opened.success, true)
  assert.equal(opened.fileName, 'share.json')
  assert.equal(opened.content, '{"ok":true}')
  assert.equal(JSON.stringify(opened).includes(directory), false)

  const oversizedPath = path.join(directory, 'oversized.json')
  await writeFile(oversizedPath, Buffer.alloc(CONFIG_BUNDLE_MAX_BYTES + 1))
  const oversized = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [oversizedPath] })
  })
  assert.equal(oversized.errorCode, 'CONFIG_FILE_TOO_LARGE')
  assert.equal('content' in oversized, false)

  const invalidUtf8Path = path.join(directory, 'invalid-utf8.json')
  await writeFile(invalidUtf8Path, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]))
  const invalidUtf8 = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [invalidUtf8Path] })
  })
  assert.equal(invalidUtf8.errorCode, 'CONFIG_FILE_ENCODING_INVALID')
  assert.equal('content' in invalidUtf8, false)
})

test('config transfer file access rejects non-main senders before opening a dialog', async () => {
  let dialogOpened = false
  const result = await openConfigTransferFile({
    event: { sender: {} },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: {} }),
    showOpenDialog: async () => { dialogOpened = true; return { canceled: true } }
  })
  assert.equal(result.errorCode, 'CONFIG_TRANSFER_FORBIDDEN')
  assert.equal(dialogOpened, false)
})

test('config transfer save uses a temporary sibling and reports only basename', async (t) => {
  const directory = await temporaryDirectory(t)
  const target = path.join(directory, 'backup.json')
  const context = mainWindowContext()
  const result = await saveConfigTransferFile({
    ...context,
    payload: { content: '{"kind":"test"}\n', suggestedName: '..\\private.json' },
    showSaveDialog: async (_owner, options) => {
      assert.equal(options.defaultPath.includes('..'), false)
      assert.equal(options.defaultPath.includes('\\'), false)
      return { canceled: false, filePath: target }
    }
  })
  assert.deepEqual(result, { success: true, canceled: false, fileName: 'backup.json' })
  assert.equal(await readFile(target, 'utf8'), '{"kind":"test"}\n')
  assert.deepEqual((await readdir(directory)).filter(name => name.endsWith('.tmp')), [])
})

test('config transfer save cleans temporary files when atomic replacement fails', async (t) => {
  const directory = await temporaryDirectory(t)
  const targetDirectory = path.join(directory, 'target.json')
  await mkdir(targetDirectory)
  const context = mainWindowContext()
  const result = await saveConfigTransferFile({
    ...context,
    payload: { content: '{}', suggestedName: 'target.json' },
    showSaveDialog: async () => ({ canceled: false, filePath: targetDirectory })
  })
  assert.equal(result.errorCode, 'CONFIG_SAVE_FAILED')
  assert.deepEqual((await readdir(directory)).filter(name => name.endsWith('.tmp')), [])
})

test('preload, renderer facade and ipc registry expose only dedicated config transfer channels', async () => {
  const [preload, rendererApi, ipcIndex, handler] = await Promise.all([
    readFile(path.join(repositoryRoot, 'electron/preload.cjs'), 'utf8'),
    readFile(path.join(repositoryRoot, 'src/api/electron.js'), 'utf8'),
    readFile(path.join(repositoryRoot, 'electron/modules/ipc/index.js'), 'utf8'),
    readFile(path.join(repositoryRoot, 'electron/modules/ipc/configTransfer.js'), 'utf8')
  ])
  assert.match(preload, /config-transfer:open/)
  assert.match(preload, /config-transfer:save/)
  assert.match(rendererApi, /configTransfer:\s*\{/)
  assert.match(ipcIndex, /registerConfigTransferHandlers/)
  assert.match(handler, /openConfigTransferFile/)
  assert.match(handler, /saveConfigTransferFile/)
  assert.doesNotMatch(preload, /replaceCraftingPriceOverrides/)
  assert.doesNotMatch(rendererApi, /replacePriceOverrides/)
})
