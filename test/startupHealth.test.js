import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import {
  createStartupHealth,
  evaluateAdministrator,
  evaluateDisplays,
  evaluateNetworkInterfaces,
  evaluateWindowsSupport
} from '../electron/modules/system/health.js'

test('启动健康检查接受 Windows 10/11 x64 并拒绝其他架构', () => {
  assert.equal(evaluateWindowsSupport({ platform: 'win32', arch: 'x64', release: '10.0.19045' }).status, 'ready')
  assert.equal(evaluateWindowsSupport({ platform: 'win32', arch: 'arm64', release: '10.0.26100' }).status, 'error')
  assert.equal(evaluateWindowsSupport({ platform: 'linux', arch: 'x64', release: '6.1' }).status, 'error')
})

test('显示器健康检查保留多屏、负坐标和缩放信息', () => {
  const result = evaluateDisplays([
    { bounds: { x: -1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.25 },
    { bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 2 }
  ])
  assert.equal(result.status, 'ready')
  assert.equal(result.count, 2)
  assert.equal(result.hasNegativeCoordinates, true)
  assert.deepEqual(result.scaleFactors, [1.25, 2])
})

test('网络与管理员检查只返回状态，不泄露接口地址', () => {
  const network = evaluateNetworkInterfaces({
    Ethernet: [{ address: '192.0.2.25', family: 'IPv4', internal: false }]
  })
  assert.equal(network.status, 'ready')
  assert.equal(network.activeCount, 1)
  assert.doesNotMatch(JSON.stringify(network), /192\.0\.2\.25/)
  assert.equal(evaluateAdministrator(false).status, 'attention')
})

test('统一启动健康检查覆盖系统、目录、权限、显示、网络、运行时和游戏窗口', async () => {
  const result = await createStartupHealth({
    userDataPath: os.tmpdir(),
    platform: 'win32',
    arch: 'x64',
    release: '10.0.26100',
    administrator: true,
    displays: [{ bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }],
    networkInterfaces: { Ethernet: [{ family: 'IPv4', internal: false }] },
    runtime: { ready: true, source: 'bundled', version: '3.13.14' },
    gameDpi: { found: true, dpi: 144, scaleFactor: 1.5 }
  })
  assert.deepEqual(result.items.map((entry) => entry.id), [
    'platform', 'userData', 'administrator', 'displays', 'network', 'runtime', 'game'
  ])
  assert.ok(result.items.every((entry) => entry.status === 'ready'))
})
