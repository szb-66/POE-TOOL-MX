import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { LootClickObserver } from '../electron/modules/mapTracker/lootClickObserver.js'

test('掉落点击观察器按事件 ID 只重放一次并可立即停止', async () => {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stdout.setEncoding = () => {}; child.stdin = { values: [], write(value){ this.values.push(value) } }; child.kill = () => { child.killed = true }
  const observer = new LootClickObserver({ pythonPath: 'python', scriptPath: 'loot.py', spawnImpl: (_file, args, options) => { assert.deepEqual(args, ['loot.py']); assert.equal(options.shell, false); return child } })
  const stop = observer.start(async event => { await event.replay(); await event.replay() })
  child.stdout.emit('data', '{"event":"ctrl-click","id":7}\n'); await new Promise(resolve => setImmediate(resolve))
  assert.equal(child.stdin.values.length, 1); assert.match(child.stdin.values[0], /"id":7/)
  stop(); assert.equal(child.killed, true)
})
