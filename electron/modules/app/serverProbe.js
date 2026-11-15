// 不保存响应正文、账号、物品、URL 参数和凭据。每次由用户手动触发，逐项探测。
export async function probeServerCapabilities({ auth, stash, trade, characters, league = '' }) {
  const report = []
  const check = async (capability, label, action) => {
    try { await action(); report.push({ capability, label, state: '接口结构验证通过（仍需功能实测）' }); return true }
    catch (error) {
      report.push({ capability, label, state: error?.code || 'NETWORK_ERROR', ...(Number.isInteger(error?.details?.status) ? { status: error.details.status } : {}) })
      return false
    }
  }
  const authenticated = await check('account', '账号识别', () => auth.validate())
  let leagues = []
  if (authenticated) await check('leagues', '赛季列表', async () => { leagues = await stash.listLeagues() })
  else report.push({ capability: 'leagues', label: '赛季列表', state: '未登录，未测试' })
  const statsOk = await check('trade-directory', '交易目录', () => trade.getStats())
  const selected = leagues.some(entry => entry.id === league) ? league : leagues[0]?.id
  if (authenticated && selected && statsOk) {
    await check('trade-search', '交易搜索与挂单', async () => {
      const search = await trade.search(selected, { query: { status: { option: 'online' }, stats: [{ type: 'and', filters: [] }] }, sort: { price: 'asc' } })
      const ids = Array.isArray(search.result) ? search.result : Object.keys(search.result || {})
      if (ids.length) await trade.fetch(search.id, ids.slice(0, 2))
    })
  } else report.push({ capability: 'trade-search', label: '交易搜索', state: '缺少已验证会话或赛季，未测试' })
  if (authenticated && selected) await check('stash', '仓库列表与内容', async () => {
    const tabs = await stash.listTabs(selected)
    const tab = tabs.find(entry => entry.supported)
    if (tab) await stash.fetchTab(selected, tab)
  })
  else report.push({ capability: 'stash', label: '仓库页列表', state: '缺少已验证会话或赛季，未测试' })
  if (authenticated) await check('characters', '角色列表', characters)
  else report.push({ capability: 'characters', label: '角色列表', state: '未登录，未测试' })
  return report
}
