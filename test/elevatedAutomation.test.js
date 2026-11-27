import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import {
  ELEVATED_OPERATION_IDS,
  ElevatedAutomationBroker,
  ElevatedPipeError,
  ElevatedRunAsError,
  NamedPipeHostConnection,
  READ_ONLY_OPERATION_IDS,
  RemoteElevatedChild,
  SmartChildProxy,
  buildRunAsInvocation,
  configureElevatedAutomation,
  connectNamedPipeHost,
  createSessionPipeName,
  launchElevatedHostWithPowerShell,
  spawnOperationProcess
} from '../electron/modules/elevatedAutomation/index.js'
import { stopPythonProcess } from '../electron/modules/python/process.js'
import {
  assertWindowsGameForeground,
  disposeWindowsClipboardHelper,
  sendWindowsCopy,
  warmWindowsClipboardHelper
} from '../electron/modules/priceCheck/clipboardCapture.js'
import {
  assertWindowsExecutableAsInvoker,
  parseRequestedExecutionLevel
} from '../scripts/release/windowsExecutableManifest.js'

class FakeConnection extends EventEmitter {
  constructor(hostProcessId = 4242) {
    super()
    this.hostProcessId = hostProcessId
    this.closed = false
    this.sent = []
  }

  async send(message) {
    if (this.closed) throw new Error('closed')
    this.sent.push(message)
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.emit('close')
  }
}

class FakeLocalChild extends EventEmitter {
  constructor(pid = 9001) {
    super()
    this.pid = pid
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.stdin = new PassThrough()
    this.exitCode = null
    this.signalCode = null
    this.killed = false
  }

  kill() {
    this.killed = true
    this.exitCode = 0
    this.emit('exit', 0, null)
    this.emit('close', 0, null)
    return true
  }
}

test('高权限操作与只读操作清单互斥且覆盖全部核心输入能力', () => {
  const elevated = new Set(ELEVATED_OPERATION_IDS)
  const readOnly = new Set(READ_ONLY_OPERATION_IDS)
  for (const id of readOnly) {
    assert.equal(elevated.has(id), false, `${id} 不应同时在只读与高权限列表中`)
  }
  for (const required of [
    'window.activate-game',
    'price.copy-item',
    'crafting.items',
    'crafting.maps',
    'combat.assist',
    'bag.auto-stash',
    'chaos-recipe.pickup',
    'stash-tabs.select',
    'stash-pickup.run',
    'junfeng.pickup',
    'puzzle.analyze',
    'puzzle.chart-mods',
    'puzzle.auto-place',
    'faustus.repricing',
    'sanctum.native',
    'map-tracker.loot-click'
  ]) {
    assert.equal(elevated.has(required), true, `缺少高权限操作 ${required}`)
  }
})

test('RunAs 启动参数通过 UTF-8 Base64 编码中文路径并识别 UAC 取消', async () => {
  const invocation = buildRunAsInvocation({
    pythonPath: 'C:\\Program Files\\流放助手\\resources\\python-runtime\\python.exe',
    hostPath: 'C:\\Program Files\\流放助手\\resources\\elevated-automation-host\\host.py',
    resourceRoot: 'C:\\Program Files\\流放助手\\resources',
    pipeName: '\\\\.\\pipe\\PoECNHelper.ElevatedAutomation.testpipe1234',
    parentProcessId: 12345,
    powershellPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
  })
  assert.equal(invocation.args[2], '-EncodedCommand')
  const decodedScript = Buffer.from(invocation.args[3], 'base64').toString('utf16le')
  assert.match(decodedScript, /-Verb RunAs/)
  assert.doesNotMatch(decodedScript, /流放助手/)

  const ok = await launchElevatedHostWithPowerShell(invocation, {
    execFileImpl: async () => ({ stdout: 'ELEVATED_AUTOMATION_PID=8888\n' })
  })
  assert.equal(ok.processId, 8888)

  await assert.rejects(
    () => launchElevatedHostWithPowerShell(invocation, {
      execFileImpl: async () => { throw Object.assign(new Error('The operation was canceled by the user'), { code: 1223 }) }
    }),
    error => error instanceof ElevatedRunAsError && error.code === 'ELEVATION_CANCELLED'
  )
})

test('命名管道握手校验 Host PID 且拒绝身份不匹配', async () => {
  const socket = new EventEmitter()
  socket.write = (_body, _enc, cb) => cb?.(null)
  socket.end = () => {}
  socket.destroy = () => {}
  const connection = new NamedPipeHostConnection(socket)
  const waiting = connection.waitForHello(5555, 2000)
  socket.emit('data', `${JSON.stringify({ type: 'hello', protocolVersion: 1, hostProcessId: 9999 })}\n`)
  await assert.rejects(waiting, error => error instanceof ElevatedPipeError && error.code === 'HOST_IDENTITY_MISMATCH')
})

test('智能按需代理：游戏为普通权限时本地执行且零 UAC', async () => {
  let launchCalls = 0
  let localCalls = 0
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'C:\\python.exe', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => { launchCalls += 1; return { processId: 1000 } },
    connectHost: async () => new FakeConnection(1000),
    probeCurrentElevated: async () => false,
    probeGameElevation: async () => 'standard',
    spawnLocal: () => { localCalls += 1; return new FakeLocalChild(3001) }
  })

  const child = await broker.spawnSmart({
    operationId: 'bag.auto-stash',
    pythonPath: 'C:\\python.exe',
    localScriptPath: 'C:\\res\\bag_auto_stash_template.py',
    args: ['--mode', 'stash']
  })
  assert.equal(launchCalls, 0)
  assert.equal(localCalls, 1)
  assert.equal(child.pid, 3001)
})

test('智能按需代理：主进程已为管理员时本地执行且零 UAC', async () => {
  let launchCalls = 0
  let localCalls = 0
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'C:\\python.exe', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => { launchCalls += 1; return { processId: 1000 } },
    connectHost: async () => new FakeConnection(1000),
    probeCurrentElevated: async () => true,
    probeGameElevation: async () => 'elevated',
    spawnLocal: () => { localCalls += 1; return new FakeLocalChild(3002) }
  })

  const child = await broker.spawnSmart({
    operationId: 'combat.assist',
    pythonPath: 'C:\\python.exe',
    localScriptPath: 'C:\\res\\combat_assist_template.py',
    args: ['--mode', 'potion']
  })
  assert.equal(launchCalls, 0)
  assert.equal(localCalls, 1)
  assert.equal(child.pid, 3002)
})

test('智能按需代理：游戏为管理员时合并并发 UAC、复用 Host 并支持双向流与取消重试', async () => {
  let launchAttempts = 0
  const connection = new FakeConnection(7777)
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'C:\\python.exe', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => {
      launchAttempts += 1
      if (launchAttempts === 1) throw new ElevatedRunAsError('ELEVATION_CANCELLED', '用户取消了管理员授权')
      return { processId: 7777 }
    },
    connectHost: async () => connection,
    probeCurrentElevated: async () => false,
    probeGameElevation: async () => 'elevated'
  })

  // 第一次取消 UAC：不缓存失败 Promise
  const failedChild = await broker.spawnSmart({
    operationId: 'faustus.repricing',
    pythonPath: 'C:\\python.exe',
    localScriptPath: 'C:\\res\\faustus_market_repricing.py',
    stdin: 'pipe'
  })
  const firstError = await new Promise(resolve => failedChild.once('error', resolve))
  assert.equal(firstError.code, 'ELEVATION_CANCELLED')
  assert.equal(launchAttempts, 1)

  // 下一次并发发起两个输入操作：仅触发一次 RunAs 并复用同一连接
  const [childA, childB] = await Promise.all([
    broker.spawnSmart({ operationId: 'faustus.repricing', pythonPath: 'C:\\python.exe', localScriptPath: 'C:\\res\\f.py', stdin: 'pipe' }),
    broker.spawnSmart({ operationId: 'sanctum.native', pythonPath: 'C:\\python.exe', localScriptPath: 'C:\\res\\s.py', stdin: 'pipe' })
  ])
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(launchAttempts, 2)
  const spawnMessages = connection.sent.filter(item => item.type === 'spawn')
  assert.equal(spawnMessages.length, 2)

  // 验证双向 stdin/stdout 与 stopPythonProcess 远程停止
  childA.stdin.write('{"cmd":"ping"}\n')
  await new Promise(resolve => setImmediate(resolve))
  assert.ok(connection.sent.some(item => item.type === 'stdin' && item.requestId === childA.requestId && item.data.includes('ping')))

  let output = ''
  childA.stdout.on('data', chunk => { output += chunk.toString('utf8') })
  connection.emit('message', { type: 'started', requestId: childA.requestId, processId: 8100 })
  connection.emit('message', { type: 'stdout', requestId: childA.requestId, data: 'READY\n' })
  assert.equal(childA.pid, 8100)
  assert.equal(output, 'READY\n')

  let taskkillCalled = false
  const stopPromise = stopPythonProcess(childA, {
    killTree: async () => { taskkillCalled = true; return false }
  })
  await new Promise(resolve => setImmediate(resolve))
  assert.ok(connection.sent.some(item => item.type === 'stop' && item.requestId === childA.requestId))
  connection.emit('message', { type: 'exited', requestId: childA.requestId, exitCode: 0 })
  assert.equal(await stopPromise, true)
  assert.equal(taskkillCalled, false)

  await broker.stopAll()
  assert.ok(connection.sent.some(item => item.type === 'stop-all'))
  await broker.shutdown()
  assert.ok(connection.sent.some(item => item.type === 'shutdown'))
  assert.equal(childB.terminated, true)
})

test('SmartChildProxy 缓冲异步就绪前的 stdin 并透传输出', async () => {
  const localChild = new FakeLocalChild(5050)
  let receivedStdin = ''
  localChild.stdin.on('data', chunk => { receivedStdin += chunk.toString('utf8') })

  const proxy = new SmartChildProxy(
    new Promise(resolve => setTimeout(() => resolve(localChild), 10)),
    { stdinMode: 'pipe' }
  )
  proxy.stdin.write('hello-early\n')
  let receivedStdout = ''
  proxy.stdout.on('data', chunk => { receivedStdout += chunk.toString('utf8') })

  await new Promise(resolve => setTimeout(resolve, 30))
  localChild.stdout.write('reply-ok\n')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(proxy.pid, 5050)
  assert.equal(receivedStdin, 'hello-early\n')
  assert.equal(receivedStdout, 'reply-ok\n')
  proxy.kill('SIGTERM')
})

test('spawnOperationProcess 在未配置 broker 时回退本地，配置后走智能代理', async () => {
  const fallbackChild = new FakeLocalChild(6001)
  configureElevatedAutomation(null)
  const local = spawnOperationProcess({
    operationId: 'bag.auto-stash',
    pythonPath: 'python',
    scriptPath: 'bag.py',
    fallbackSpawn: () => fallbackChild
  })
  assert.equal(local, fallbackChild)
})

test('Windows EXE 清单校验接受 asInvoker 并拒绝 requireAdministrator', async () => {
  const asInvokerXml = '<?xml version="1.0"?><assembly><trustInfo><security><requestedPrivileges><requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges></security></trustInfo></assembly>'
  const adminXml = asInvokerXml.replace('asInvoker', 'requireAdministrator')
  assert.equal(parseRequestedExecutionLevel(asInvokerXml), 'asInvoker')
  assert.equal(parseRequestedExecutionLevel(adminXml), 'requireAdministrator')

  const makeMock = xml => ({
    readFileImpl: async () => Buffer.from('MZ'),
    executableParser: { from: () => ({}) },
    resourceParser: { from: () => ({ getResourceEntriesAsString: () => [[1033, xml]] }) }
  })
  const entries = await assertWindowsExecutableAsInvoker('fake.exe', makeMock(asInvokerXml))
  assert.equal(entries[0].level, 'asInvoker')
  await assert.rejects(() => assertWindowsExecutableAsInvoker('fake.exe', makeMock(adminXml)))
})

test('connectNamedPipeHost 重试 ENOENT 后握手成功且不触发未捕获异常', async () => {
  const uncaught = []
  const onUncaught = error => uncaught.push(error)
  process.on('uncaughtException', onUncaught)
  try {
    let attempts = 0
    const connection = await connectNamedPipeHost({
      pipeName: createSessionPipeName(),
      expectedHostProcessId: 6789,
      timeoutMs: 2000,
      createConnection: () => {
        attempts += 1
        const socket = new EventEmitter()
        socket.setEncoding = () => {}
        socket.write = (_body, _enc, cb) => cb?.(null)
        socket.end = () => {}
        socket.destroy = () => {}
        setTimeout(() => {
          if (attempts < 3) {
            socket.emit('error', Object.assign(new Error('connect ENOENT'), { code: 'ENOENT' }))
          } else {
            socket.emit('connect')
            socket.emit('data', `${JSON.stringify({ type: 'hello', protocolVersion: 1, hostProcessId: 6789 })}\n`)
          }
        }, 5)
        return socket
      }
    })
    assert.equal(attempts, 3)
    assert.equal(connection.closed, false)
    connection.close()
    assert.deepEqual(uncaught, [])
  } finally {
    process.removeListener('uncaughtException', onUncaught)
  }
})

test('connectNamedPipeHost 连接不存在的真实命名管道超时时安全 reject 且无未捕获异常', async () => {
  const uncaught = []
  const onUncaught = error => uncaught.push(error)
  process.on('uncaughtException', onUncaught)
  try {
    await assert.rejects(
      () => connectNamedPipeHost({
        pipeName: createSessionPipeName(),
        expectedHostProcessId: 99999,
        timeoutMs: 200
      }),
      error => error instanceof ElevatedPipeError && error.code === 'HOST_CONNECT_TIMEOUT'
    )
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.deepEqual(uncaught, [])
  } finally {
    process.removeListener('uncaughtException', onUncaught)
  }
})

test('waitForHello 阶段发生非法消息或 socket 报错时安全关闭并 reject', async () => {
  const uncaught = []
  const onUncaught = error => uncaught.push(error)
  process.on('uncaughtException', onUncaught)
  try {
    const makeSocket = () => {
      const socket = new EventEmitter()
      socket.setEncoding = () => {}
      socket.write = (_body, _enc, cb) => cb?.(null)
      socket.end = () => {}
      socket.destroy = () => {}
      return socket
    }

    const invalidSocket = makeSocket()
    const invalidConn = new NamedPipeHostConnection(invalidSocket)
    const invalidWait = invalidConn.waitForHello(1234, 2000)
    invalidSocket.emit('data', 'not-json\n')
    await assert.rejects(
      invalidWait,
      error => error instanceof ElevatedPipeError && error.code === 'INVALID_PIPE_MESSAGE'
    )
    assert.equal(invalidConn.closed, true)

    const errorSocket = makeSocket()
    const errorConn = new NamedPipeHostConnection(errorSocket)
    const errorWait = errorConn.waitForHello(1234, 2000)
    errorSocket.emit('error', Object.assign(new Error('pipe broken'), { code: 'EPIPE' }))
    await assert.rejects(
      errorWait,
      error => error instanceof ElevatedPipeError && error.code === 'HOST_CONNECT_FAILED'
    )
    assert.equal(errorConn.closed, true)
    assert.deepEqual(uncaught, [])
  } finally {
    process.removeListener('uncaughtException', onUncaught)
  }
})

test('查价复制助手在高权限 Host 已连接时复用单个常驻 resident 进程而非反复冷启动', async () => {
  if (process.platform !== 'win32') return
  const connection = new FakeConnection(8888)
  const actions = []
  let activeRequestId = null
  const origSend = connection.send.bind(connection)
  connection.send = async (message) => {
    await origSend(message)
    if (message.type === 'spawn') {
      activeRequestId = message.requestId
      queueMicrotask(() => {
        connection.emit('message', { type: 'started', requestId: message.requestId, processId: 9100 })
      })
    } else if (message.type === 'stdin' && message.requestId === activeRequestId) {
      for (const line of String(message.data || '').split(/\r?\n/).filter(Boolean)) {
        const req = JSON.parse(line)
        if (req.action === 'quit') continue
        actions.push(req.action)
        queueMicrotask(() => {
          connection.emit('message', {
            type: 'stdout',
            requestId: message.requestId,
            data: `${JSON.stringify({ id: req.id, ok: true, code: 0 })}\n`
          })
        })
      }
    }
  }

  let probeGameCalls = 0
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'C:\\python.exe', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => ({ processId: 8888 }),
    connectHost: async () => connection,
    probeCurrentElevated: async () => false,
    probeGameElevation: async () => { probeGameCalls += 1; return 'elevated' }
  })
  broker._attachConnection(connection)
  configureElevatedAutomation(broker)

  try {
    assert.equal(warmWindowsClipboardHelper('C:\\python.exe'), true)
    await assertWindowsGameForeground('C:\\python.exe')
    await assertWindowsGameForeground('C:\\python.exe')
    await sendWindowsCopy('C:\\python.exe')

    const spawns = connection.sent.filter(item => item.type === 'spawn')
    assert.equal(spawns.length, 1, '已连接 Host 时多次 check/copy 应复用同一个 resident 子进程')
    assert.equal(spawns[0].operationId, 'price.copy-item')
    assert.deepEqual(spawns[0].args, ['resident'])
    assert.equal(spawns[0].stdin, 'pipe')
    assert.deepEqual(actions, ['check', 'check', 'copy'])
    assert.equal(probeGameCalls, 0, '已连接 Host 时不应额外探测游戏权限')
  } finally {
    disposeWindowsClipboardHelper()
    configureElevatedAutomation(null)
    connection.close()
  }
})

test('查价复制助手在未连接高权限 Host 时优先走本地常驻进程且不触发游戏权限探测', async () => {
  if (process.platform !== 'win32') return
  let probeGameCalls = 0
  let execCalls = 0
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'python', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => { throw new Error('should not launch host during local check') },
    connectHost: async () => { throw new Error('should not connect host') },
    probeCurrentElevated: async () => false,
    probeGameElevation: async () => { probeGameCalls += 1; return 'standard' }
  })
  const origExec = broker.execSmart.bind(broker)
  broker.execSmart = async (...args) => { execCalls += 1; return origExec(...args) }
  configureElevatedAutomation(broker)

  try {
    assert.equal(warmWindowsClipboardHelper('python'), true)
    await assert.rejects(
      () => assertWindowsGameForeground('python'),
      error => error?.code === 'GAME_NOT_FOREGROUND'
    )
    assert.equal(probeGameCalls, 0, '本地常驻检查不应触发冷启动 probeGameElevation')
    assert.equal(execCalls, 0, '本地常驻检查不应回退一次性 execSmart')
  } finally {
    disposeWindowsClipboardHelper()
    configureElevatedAutomation(null)
  }
})

test('shouldUseElevatedHost 短时缓存 standard 探测并合并并发探测，unknown 不缓存且过期后重测', async () => {
  let now = 10_000
  let probeCalls = 0
  let nextLevel = 'standard'
  const broker = new ElevatedAutomationBroker({
    platform: 'win32',
    resolveRuntime: async () => ({ pythonPath: 'C:\\python.exe', hostPath: 'C:\\host.py', resourceRoot: 'C:\\res' }),
    launchHost: async () => ({ processId: 1000 }),
    connectHost: async () => new FakeConnection(1000),
    probeCurrentElevated: async () => false,
    probeGameElevation: async () => {
      probeCalls += 1
      await new Promise(resolve => setTimeout(resolve, 10))
      return nextLevel
    },
    standardElevationCacheTtlMs: 3000,
    now: () => now
  })

  // 并发调用合并为一次探测
  const concurrent = await Promise.all([
    broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' }),
    broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' })
  ])
  assert.deepEqual(concurrent, [false, false])
  assert.equal(probeCalls, 1)

  // 3 秒 TTL 内串联调用（如 activateGame 后紧跟 spawn）直接命中缓存
  now += 2500
  assert.equal(await broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' }), false)
  assert.equal(probeCalls, 1)

  // forceElevated 立即绕过并失效缓存
  assert.equal(await broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe', forceElevated: true }), true)
  nextLevel = 'unknown'
  assert.equal(await broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' }), true)
  assert.equal(probeCalls, 2)

  // unknown 不缓存，下一次立刻重测
  nextLevel = 'standard'
  assert.equal(await broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' }), false)
  assert.equal(probeCalls, 3)

  // 超过 3 秒 TTL 后重新探测
  now += 3000
  nextLevel = 'elevated'
  assert.equal(await broker.shouldUseElevatedHost({ pythonPath: 'C:\\python.exe' }), true)
  assert.equal(probeCalls, 4)
})
