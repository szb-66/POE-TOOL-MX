import manifest from '../../../electron/assets/sanctum/currency/manifest.json'
const files = import.meta.glob('../../../electron/assets/sanctum/currency/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
const urls = new Map(manifest.entries.map(entry => [entry.name,
  files[`../../../electron/assets/sanctum/currency/${entry.iconFile}`]]))
export const currencyIcon = name => urls.get(name)
