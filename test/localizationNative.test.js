import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'

const executable = path.resolve('.runtime/localization-helper/LocalizationHelper.exe')
test('built native helper verifies codec frames, DAT safety, applied previews and repeated-apply language recovery', { skip: !fs.existsSync(executable) }, async () => {
  const helper = new LocalizationHelperClient({ executable, timeoutMs: 60000 })
  const result = await helper.run('self-test', {})
  assert.equal(result.passed, true)
  assert.equal(result.codecCases, 6)
  assert.ok(result.dataCases >= 21)
  assert.equal(result.transaction.passed, true)
  assert.ok(result.transaction.cases >= 19)
})
