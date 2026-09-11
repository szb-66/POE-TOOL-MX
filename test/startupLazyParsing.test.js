import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { CraftingDataUpdater } from '../electron/modules/crafting/updater.js'

test('运行时服务和本地快照不加载 Cheerio 网页解析依赖', () => {
  const code = `
    import { registerHooks } from 'node:module';
    registerHooks({ resolve(specifier, context, next) {
      if (specifier === 'cheerio') throw new Error('unexpected startup parser');
      return next(specifier, context);
    }});
    await import('./electron/modules/crafting/service.js');
    const { UniqueItemImageRepository } = await import('./electron/modules/priceCheck/uniqueItemSnapshot.js');
    await new UniqueItemImageRepository().load();
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: new URL('..', import.meta.url), encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0, result.stderr)
})

test('做装解析器加载中取消，不请求网络且释放更新占用，失败后可重试', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-lazy-parser-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  let release; let requests = 0
  const updater = new CraftingDataUpdater({ repository: {}, storageRoot: root, loadParser: () => new Promise(resolve => { release = resolve }), fetchImpl: () => { requests++; throw new Error('unexpected request') } })
  assert.equal(release, undefined)
  const pending = updater.update()
  await assert.rejects(updater.update(), /已有数据更新/)
  updater.cancel()
  release({})
  await assert.rejects(pending, /数据更新已取消/)
  assert.equal(requests, 0)
  assert.equal(updater.controller, null)
  updater.loadParser = async () => { throw new Error('parser unavailable') }
  await assert.rejects(updater.update(), /parser unavailable/)
  assert.equal(updater.controller, null)
})
