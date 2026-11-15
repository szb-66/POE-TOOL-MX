import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { loadInternationalTradeCatalog, loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { UniqueItemImageRepository, registerUniqueItemImageProtocol } from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import { resolveUnidentifiedUnique } from '../electron/modules/priceCheck/query.js'
import { generateServerTradeCatalog } from '../scripts/generateServerTradeCatalog.js'

test('国际服未鉴定节庆之面候选在无汉化词库时也能通过本地协议读取真实图片', async () => {
  const repository = new UniqueItemImageRepository()
  await repository.load()
  const { catalog } = await loadInternationalTradeCatalog({ uniqueItemCatalog: repository.catalog })
  const cached = await loadInternationalTradeCatalog({
    cacheFile: fileURLToPath(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)),
    uniqueItemCatalog: repository.catalog
  })
  assert.equal(cached.status.provider, 'cached')
  assert.notEqual(cached.catalog.items.find(item => item.name === 'Leer Cast').imageId, 'placeholder')
  const model = resolveUnidentifiedUnique({
    item: { rarity: '传奇', unidentified: true, baseType: 'Festival Mask' },
    identity: { name: '', type: 'Festival Mask' }
  }, catalog)
  assert.deepEqual(model.identityResolution.candidates.map(candidate => candidate.name), ['Leer Cast', 'Replica Leer Cast'])
  let handler
  registerUniqueItemImageProtocol({
    repository,
    protocol: { handle: (_scheme, value) => { handler = value } },
    net: { fetch: async url => new Response(await readFile(fileURLToPath(url))) }
  })
  for (const candidate of model.identityResolution.candidates) {
    assert.notEqual(candidate.imageId, 'placeholder', candidate.name)
    const response = await handler({ url: candidate.imageUrl })
    assert.equal(response.status, 200)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.ok(bytes.length > 100)
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  }
  assert.ok(catalog.items.filter(item => item.name === 'Leer Cast').every(item => !item.uniqueSnapshotCovered && !item.uniqueModifierMatchers))
})

test('国际服实时目录刷新保留本地图片映射且不注入国服词缀', async () => {
  const repository = new UniqueItemImageRepository()
  await repository.load()
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const payloads = {
    stats: { result: [{ id: 'explicit', entries: Array.from({ length: 110 }, (_, index) => ({ id: `explicit.stat_${index}`, text: `Fixture ${index}: +# to Life` })) }] },
    items: { result: [{ id: 'armour.helmet', entries: [
      { name: 'Leer Cast', type: 'Festival Mask', flags: { unique: true } },
      { name: 'Replica Leer Cast', type: 'Festival Mask', flags: { unique: true } },
      ...Array.from({ length: 110 }, (_, index) => ({ type: `Fixture Base ${index}` }))
    ] }] },
    static: { result: [{ id: 'currency', entries: [{ id: 'chaos', text: 'Chaos Orb' }] }] }
  }
  const result = await generateServerTradeCatalog({
    server: 'international', gameVersion: 'live', baseCatalog, uniqueItemCatalog: repository.catalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)]))
  })
  for (const name of ['Leer Cast', 'Replica Leer Cast']) {
    const item = result.catalog.items.find(item => item.name === name)
    assert.notEqual(item.imageId, 'placeholder')
    assert.ok(repository.imageInfo(item.imageId))
    assert.equal(item.uniqueSnapshotCovered, undefined)
    assert.equal(item.uniqueModifierMatchers, undefined)
  }
})
