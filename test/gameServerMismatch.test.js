import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  detectGameServerMismatch,
  inferGameWindowServer
} from '../shared/gameServerMismatch.js'
import { evaluateGameWindow } from '../electron/modules/system/health.js'

test('根据进程名、窗口标题与安装路径准确识别国服与国际服客户端', () => {
  assert.equal(inferGameWindowServer({
    title: '流放之路',
    processName: 'PathOfExile_x64.exe'
  }), 'cn')

  assert.equal(inferGameWindowServer({
    title: 'Path of Exile',
    processName: 'PathOfExileSteam.exe'
  }), 'international')

  assert.equal(inferGameWindowServer({
    title: 'Path of Exile',
    processName: 'PathOfExile_x64EGS.exe'
  }), 'international')

  assert.equal(inferGameWindowServer({
    title: 'Path of Exile',
    processName: 'PathOfExile_x64.exe',
    executablePath: 'D:\\Games\\Grinding Gear Games\\Path of Exile\\PathOfExile_x64.exe'
  }), 'international')

  assert.equal(inferGameWindowServer({
    title: 'Path of Exile',
    processName: 'PathOfExile_x64.exe',
    executablePath: 'D:\\WeGameApps\\rail_apps\\流放之路(2000180)\\PathOfExile_x64.exe'
  }), 'cn')

  // 非游戏进程（如浏览器打开官网页面）绝不误报
  assert.equal(inferGameWindowServer({
    title: '流放之路 - Google Chrome',
    processName: 'chrome.exe'
  }), null)
  assert.equal(inferGameWindowServer({
    title: 'Path of Exile - Microsoft Edge',
    processName: 'msedge.exe'
  }), null)
})

test('国际服助手运行国服客户端与国服助手运行国际服客户端均返回不匹配提示', () => {
  const cnInIntl = detectGameServerMismatch({
    currentServerId: 'international',
    candidates: [
      { title: '流放之路', processName: 'PathOfExile_x64.exe', foreground: true, area: 1920 * 1080 }
    ]
  })
  assert.equal(cnInIntl.mismatch, true)
  assert.equal(cnInIntl.currentServerId, 'international')
  assert.equal(cnInIntl.detectedServerId, 'cn')
  assert.equal(cnInIntl.detectedServerLabel, '国服')
  assert.match(cnInIntl.message, /国服.*国际服/)

  const intlInCn = detectGameServerMismatch({
    currentServerId: 'cn',
    candidates: [
      { title: 'Path of Exile', processName: 'PathOfExileSteam.exe', foreground: false, area: 2560 * 1440 }
    ]
  })
  assert.equal(intlInCn.mismatch, true)
  assert.equal(intlInCn.currentServerId, 'cn')
  assert.equal(intlInCn.detectedServerId, 'international')
  assert.equal(intlInCn.detectedServerLabel, '国际服')
  assert.match(intlInCn.message, /国际服.*国服/)
})

test('匹配当前服、未启动游戏或同时双开包含当前服时不误报', () => {
  assert.equal(detectGameServerMismatch({
    currentServerId: 'cn',
    candidates: [{ title: '流放之路', processName: 'PathOfExile_x64.exe' }]
  }).mismatch, false)

  assert.equal(detectGameServerMismatch({
    currentServerId: 'international',
    candidates: []
  }).mismatch, false)

  // 双开同时存在当前服与另一服时，视为当前服已就绪，不触发误报
  assert.equal(detectGameServerMismatch({
    currentServerId: 'international',
    candidates: [
      { title: '流放之路', processName: 'PathOfExile_x64.exe' },
      { title: 'Path of Exile', processName: 'PathOfExileSteam.exe' }
    ]
  }).mismatch, false)
})

test('系统环境健康检查与前端全局提示条已正确接线', () => {
  const healthItem = evaluateGameWindow({
    found: true,
    dpi: 96,
    scaleFactor: 1,
    serverMismatch: {
      mismatch: true,
      currentServerId: 'cn',
      detectedServerId: 'international',
      message: '检测到正在运行国际服游戏客户端，当前助手为国服模式'
    }
  })
  assert.equal(healthItem.status, 'attention')
  assert.match(healthItem.text, /国际服.*国服/)

  const layout = readFileSync(new URL('../src/components/Layout/MainLayout.vue', import.meta.url), 'utf8')
  const titleBar = readFileSync(new URL('../src/components/Layout/TitleBar.vue', import.meta.url), 'utf8')
  const runtime = readFileSync(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')
  assert.match(layout, /<ServerMismatchBanner\s*\/>/)
  assert.match(titleBar, /class="server-badge"/)
  assert.match(runtime, /onGameServerMismatchChanged/)
})
