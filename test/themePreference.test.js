import test from 'node:test'
import assert from 'node:assert/strict'
import { createThemeController, THEME_STORAGE_KEY } from '../src/theme/themePreference.js'
function fixture(saved, dark = false, broken = false) {
  const listeners = new Set()
  const writes = []
  const media = { matches: dark, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }
  const controller = createThemeController({ localStorage: { getItem() { if (broken) throw Error(); return saved }, setItem(...args) { if (broken) throw Error(); writes.push(args) } }, matchMedia: () => media })
  return { controller, writes, listeners, change(value) { media.matches = value; listeners.forEach(fn => fn()) } }
}
test('默认和非法值跟随系统；系统不可用回退亮色', () => {
  for (const saved of [null, '', 'invalid']) {
    const { controller } = fixture(saved, true)
    assert.deepEqual(controller.snapshot(), { preference: 'system', resolved: 'dark' })
    controller.dispose()
  }
  const controller = createThemeController({})
  assert.deepEqual(controller.snapshot(), { preference: 'system', resolved: 'light' })
})
test('快捷切换进入手动模式，系统变化不覆盖；恢复跟随立即更新', () => {
  const f = fixture('system', true)
  const observed = []
  f.controller.subscribe(value => observed.push(value))
  f.controller.toggle()
  assert.deepEqual(f.controller.snapshot(), { preference: 'light', resolved: 'light' })
  assert.deepEqual(f.writes.at(-1), [THEME_STORAGE_KEY, 'light'])
  f.change(false); f.change(true)
  assert.equal(observed.length, 1)
  f.controller.setPreference('system')
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.change(false)
  assert.equal(observed.at(-1).resolved, 'light')
  f.controller.dispose()
  assert.equal(f.listeners.size, 0)
})
test('手动偏好恢复、连续切换、重置和存储异常', () => {
  const f = fixture('dark', false)
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.controller.toggle(); f.controller.toggle()
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.controller.setPreference('system')
  assert.equal(f.controller.snapshot().resolved, 'light')
  const failed = fixture(null, false, true)
  failed.controller.setPreference('dark')
  assert.equal(failed.controller.snapshot().resolved, 'dark')
  f.controller.dispose(); failed.controller.dispose()
})


test('启动脚本与运行时偏好解析一致，主页面与独立窗口分别处理', async () => {
  const { readFileSync } = await import('node:fs')
  const { runInNewContext } = await import('node:vm')
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  for (const saved of [null, 'system', 'light', 'dark', 'invalid']) {
    for (const systemDark of [true, false]) {
      for (const hash of ['#/', '#/settings?tab=general', '#/price-check-overlay', '#/coordinate-picker']) {
        const dataset = {}
        runInNewContext(script, {
          localStorage: { getItem: () => saved },
          window: { matchMedia: () => ({ matches: systemDark }) },
          document: { documentElement: { dataset } }, location: { hash }
        })
        const f = fixture(saved, systemDark)
        assert.equal(dataset.startupTheme, f.controller.snapshot().resolved)
        assert.equal(dataset.startupWindow, hash.includes('overlay') || hash.includes('coordinate-picker') ? 'standalone' : 'main')
        f.controller.dispose()
      }
    }
  }
})
