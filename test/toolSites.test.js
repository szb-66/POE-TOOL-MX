import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_TOOL_SITES,
  TOOL_SITES_STORAGE_KEY,
  addToolSite,
  deleteToolSite,
  loadToolSites,
  moveToolSite,
  saveToolSites,
  toolSiteImageCandidates,
  updateToolSite,
  validateToolSite
} from '../src/domains/tools/toolSites.js'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, value) },
    value(key) { return values.get(key) }
  }
}

test('首次加载写入十个默认站点，返回值与常量互不共享', () => {
  const storage = createStorage()
  const sites = loadToolSites(storage)
  assert.equal(sites.length, 10)
  assert.deepEqual(sites, DEFAULT_TOOL_SITES)
  assert.notStrictEqual(sites[0], DEFAULT_TOOL_SITES[0])
  assert.equal(JSON.parse(storage.value(TOOL_SITES_STORAGE_KEY)).version, 1)
})

test('损坏数据回退默认目录，合法空列表保持为空', () => {
  const damaged = createStorage({ [TOOL_SITES_STORAGE_KEY]: '{bad json' })
  assert.equal(loadToolSites(damaged).length, 10)

  const empty = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({ version: 1, sites: [] })
  })
  assert.deepEqual(loadToolSites(empty), [])
})

test('加载时规范化站点字段并拒绝非法结构', () => {
  const storage = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({
      version: 1,
      sites: [{ id: ' custom ', name: '  Example  ', url: 'https://example.com', description: '  描述  ', imageUrl: '' }]
    })
  })
  assert.deepEqual(loadToolSites(storage), [{
    id: 'custom', name: 'Example', url: 'https://example.com/', description: '描述', imageUrl: ''
  }])

  const invalid = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({ version: 1, sites: [{ id: '', name: 'bad' }] })
  })
  assert.equal(loadToolSites(invalid).length, 10)
})

test('站点校验限制协议、必填项和重复地址', () => {
  const sites = [{ id: 'one', name: 'One', url: 'https://example.com/', description: '', imageUrl: '' }]
  assert.deepEqual(validateToolSite({ name: '', url: 'file:///tmp/a', imageUrl: 'data:image/png,a' }, sites).errors, {
    name: '请输入站点名称',
    url: '请输入有效的 HTTP 或 HTTPS 地址',
    imageUrl: '图片地址仅支持 HTTP 或 HTTPS'
  })
  assert.equal(validateToolSite({ name: 'Duplicate', url: 'https://example.com' }, sites).errors.url, '该站点地址已存在')
  assert.equal(validateToolSite({ name: 'One', url: 'https://example.com' }, sites, 'one').valid, true)
})

test('新增、编辑、删除与移动站点保持不可变操作', () => {
  const original = [{ id: 'one', name: 'One', url: 'https://one.test/', description: '', imageUrl: '' }]
  const added = addToolSite(original, { name: ' Two ', url: 'https://two.test', description: ' D ' }, () => 'two')
  assert.equal(added.success, true)
  assert.equal(added.site.url, 'https://two.test/')
  assert.equal(original.length, 1)

  const updated = updateToolSite(added.sites, 'two', { name: 'Second', url: 'https://two.test/', description: '', imageUrl: '' })
  assert.equal(updated.success, true)
  assert.equal(updated.site.name, 'Second')
  assert.deepEqual(moveToolSite(updated.sites, 1, 0).map(site => site.id), ['two', 'one'])
  assert.deepEqual(deleteToolSite(updated.sites, 'one').map(site => site.id), ['two'])
})

test('保存失败可被调用方识别', () => {
  const storage = { setItem() { throw new Error('quota') } }
  assert.equal(saveToolSites([], storage), false)
})

test('图片候选按自定义地址、favicon 顺序生成并去重', () => {
  assert.deepEqual(toolSiteImageCandidates({
    url: 'https://example.com/path', imageUrl: 'https://cdn.example.com/logo.png'
  }), ['https://cdn.example.com/logo.png', 'https://example.com/favicon.ico'])
  assert.deepEqual(toolSiteImageCandidates({
    url: 'https://example.com/path', imageUrl: 'https://example.com/favicon.ico'
  }), ['https://example.com/favicon.ico'])
})
