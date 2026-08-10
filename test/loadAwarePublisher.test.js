import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'

class LoadingContents extends EventEmitter {
  constructor() {
    super()
    this.loading = true
    this.destroyed = false
  }

  isLoadingMainFrame() { return this.loading }
  isDestroyed() { return this.destroyed }
}

test('加载期间高频发布只注册一个 did-finish-load 并发送最新状态', () => {
  const contents = new LoadingContents()
  const publisher = createLoadAwarePublisher()
  const sent = []

  for (let index = 0; index < 20; index += 1) {
    publisher.publish(contents, () => sent.push(index))
  }

  assert.equal(contents.listenerCount('did-finish-load'), 1)
  assert.deepEqual(sent, [])
  contents.loading = false
  contents.emit('did-finish-load')
  assert.deepEqual(sent, [19])
  assert.equal(contents.listenerCount('did-finish-load'), 0)
  assert.equal(contents.listenerCount('destroyed'), 0)
})

test('窗口销毁或替换时清理旧加载监听器', () => {
  const first = new LoadingContents()
  const second = new LoadingContents()
  const publisher = createLoadAwarePublisher()

  publisher.publish(first, () => {})
  publisher.publish(second, () => {})
  assert.equal(first.listenerCount('did-finish-load'), 0)
  assert.equal(first.listenerCount('destroyed'), 0)
  assert.equal(second.listenerCount('did-finish-load'), 1)

  second.destroyed = true
  second.emit('destroyed')
  assert.equal(second.listenerCount('did-finish-load'), 0)
  publisher.dispose()
})
