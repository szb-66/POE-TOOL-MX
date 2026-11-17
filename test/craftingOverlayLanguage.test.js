import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { load } from 'cheerio'

const canonical = {
  name: 'Plentiful Diamond Flask', baseName: 'Diamond Flask', category: '功能药剂', rarity: '魔法', level: 84,
  implicitMods: ['20% increased Critical Strike Chance'],
  explicitMods: ['+22 to Maximum Charges'],
  modifiers: [{ type: 'prefix', name: 'Plentiful', tier: 4, text: '+22 to Maximum Charges', tags: [] }],
  affixMatch: true, matchedModTexts: ['+22 to Maximum Charges'],
  eldritchImplicitMatch: true, matchedEldritchText: '20% increased Critical Strike Chance'
}
const displays = [
  { displayName: 'Plentiful Diamond Flask', displayBaseName: 'Diamond Flask',
    displayImplicitMods: ['20% increased Critical Strike Chance'], displayExplicitMods: ['+22(20-23) to Maximum Charges'] },
  { displayName: '丰富的宝钻药剂', displayBaseName: '宝钻药剂',
    displayImplicitMods: ['暴击率提高 20%'], displayExplicitMods: ['最大充能 +22(20-23)'] },
  { displayName: '豐產的寶鑽藥劑', displayBaseName: '寶鑽藥劑',
    displayImplicitMods: ['增加 20% 暴擊率'], displayExplicitMods: ['+22(20-23) 最大充能'] }
]

test('制作浮窗渲染英简繁原文、数值范围并继续按规范词缀高亮，兼容旧数据', async t => {
  const vite = await createServer({ configFile: false, plugins: [vue()],
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(() => vite.close())
  const { default: Overlay } = await vite.ssrLoadModule('/src/domains/overlay/components/OverlayContent.vue')
  const render = async itemInfo => {
    const app = createSSRApp(Overlay, { itemInfo, isCompleted: true, settings: { backgroundMode: 'none' } })
    for (const name of ['el-button', 'el-icon']) app.component(name, { render() { return h('div', this.$slots.default?.()) } })
    return load(await renderToString(app))
  }
  for (const display of displays) {
    for (const detailed of [true, false]) {
      const item = { ...canonical, ...display,
        modifiers: detailed ? [{ ...canonical.modifiers[0], displayText: display.displayExplicitMods[0] }] : [] }
      const $ = await render(item)
      assert.equal($('.item-header > span').text(), display.displayName)
      assert.equal($('.item-base').text().trim(), `${display.displayBaseName}-84`)
      assert.equal($('.implicit-section .mod-text').text(), display.displayImplicitMods[0])
      const explicit = $('.mod-line').filter((_, node) => $(node).find('.mod-text').text() === display.displayExplicitMods[0])
      assert.equal(explicit.length, 1)
      assert.ok(explicit.hasClass('matched-highlight'))
      assert.ok($('.implicit-section .mod-line').hasClass('matched-highlight'))
      if (detailed) assert.equal(explicit.find('.mod-tier').text().trim(), 'P4')
    }
  }
  const legacy = await render(canonical)
  assert.equal(legacy('.item-header > span').text(), canonical.name)
  assert.equal(legacy('.item-base').text().trim(), `${canonical.baseName}-84`)
  assert.equal(legacy('.implicit-section .mod-text').text(), canonical.implicitMods[0])
  assert.equal(legacy('.mod-line .mod-text').last().text(), canonical.explicitMods[0])
})
