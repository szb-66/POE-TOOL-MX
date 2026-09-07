import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
try {
  const files = [
    '/src/domains/items/components/ModuleTwo.vue',
    '/src/domains/items/components/SpecializedCraftingPanel.vue',
    '/src/domains/items/components/AffixGoalEditor.vue',
    '/src/domains/items/components/AffixConditionRow.vue'
  ]
  for (const f of files) {
    const r = await server.transformRequest(f, { ssr: false })
    if (!r || !r.code.length) throw new Error('empty transform: ' + f)
    console.log('OK', f, r.code.length + ' chars')
  }
} finally { await server.close() }
