import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

test('浮士德 Python 识别与输入协议测试通过', () => {
  const python = resolve('.runtime/python-runtime/python.exe')
  assert.equal(existsSync(python), true, '缺少项目内 Python 运行时')
  const result = spawnSync(python, ['test/faustus_automation_py_test.py'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', OC_DISABLE_DOT_ACCESS_WARNING: '1' },
    timeout: 60_000
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
