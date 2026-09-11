import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, utimes, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { SanctumLogContext } from '../electron/modules/sanctum/logContext.js'

test('日志仅修改时间不撤销已绑定圣所，同大小改写仍撤销', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'client-timestamp-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'Client.txt')
  const body = area => `2026/09/11 02:00:07 1 x [DEBUG Client 123] Generating level 83 area "${area}" with seed 1\n2026/09/11 02:00:08 2 x [INFO Client 123] [LOADING SCREEN] (圣所宝库) Duration = 0.9 seconds\n`
  await writeFile(file, body('SanctumVaults'))
  const events = new ClientEventsService({ processProvider: async () => [{ id: 123, startedAt: '2026-09-10T00:00:00Z' }] })
  events.status.enabled = true
  const tailer = new ClientLogTailer({ filePath: file, intervalMs: 100000,
    onRecovery: entries => events.recover(entries), onState: state => events.setState(state) })
  t.after(() => tailer.stop())
  await tailer.start()
  let invalid = 0, failure
  const bound = new SanctumLogContext(events, 123, error => { invalid++; failure = error })
  t.after(() => bound.close())
  const info = await stat(file)
  await utimes(file, info.atime, new Date(info.mtimeMs + 5000))
  await tailer.poll()
  assert.equal(invalid, 0)
  assert.equal(bound.assertCurrent().floorNumber, 2)
  assert.equal(tailer.generation, 0)
  await writeFile(file, body('SanctumCellar'))
  await tailer.poll()
  assert.equal(invalid, 1)
  assert.match(failure.message, /重新同步/)
  assert.throws(() => bound.assertCurrent())
  assert.equal(tailer.generation, 1)
})
