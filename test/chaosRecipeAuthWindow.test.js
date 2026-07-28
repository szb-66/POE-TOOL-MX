import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { installExternalLinkPolicy } from '../electron/modules/window/externalLinks.js'

test('国服登录窗口不会继承主应用的系统浏览器外链拦截', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  assert.doesNotMatch(
    main,
    /app\.on\(['"]web-contents-created['"]/,
    '全局 WebContents 外链拦截会把国服登录窗导航转交给系统浏览器'
  )
  assert.match(
    main,
    /installExternalLinkPolicy\(mainWindow\.webContents/,
    '外链策略应只安装到主应用窗口'
  )
})

test('主窗口仍把网页链接交给系统浏览器且不拦截应用内地址', () => {
  let windowOpenHandler = null
  let navigateHandler = null
  const opened = []
  const contents = {
    getURL() { return 'http://localhost:3000/#/items' },
    setWindowOpenHandler(handler) { windowOpenHandler = handler },
    on(event, handler) {
      if (event === 'will-navigate') navigateHandler = handler
    }
  }
  installExternalLinkPolicy(contents, (url) => opened.push(url))

  assert.deepEqual(windowOpenHandler({ url: 'https://example.com/help' }), { action: 'deny' })
  assert.deepEqual(windowOpenHandler({ url: 'http://localhost:3000/#/shop' }), { action: 'deny' })
  assert.deepEqual(windowOpenHandler({ url: 'mailto:test@example.com' }), { action: 'deny' })

  const externalEvent = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(externalEvent, 'https://example.com/docs')
  assert.equal(externalEvent.prevented, true)

  for (const url of ['#/shop', 'http://localhost:3000/#/shop']) {
    const internalEvent = { prevented: false, preventDefault() { this.prevented = true } }
    navigateHandler(internalEvent, url)
    assert.equal(internalEvent.prevented, false)
  }

  const sameOriginExternalDocument = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(sameOriginExternalDocument, 'http://localhost:3000/docs#/shop')
  assert.equal(sameOriginExternalDocument.prevented, true)

  const blockedProtocolEvent = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(blockedProtocolEvent, 'mailto:test@example.com')
  assert.equal(blockedProtocolEvent.prevented, true)

  assert.deepEqual(opened, [
    'https://example.com/help',
    'https://example.com/docs',
    'http://localhost:3000/docs#/shop'
  ])
})
