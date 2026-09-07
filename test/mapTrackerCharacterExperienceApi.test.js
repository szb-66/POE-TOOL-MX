import test from 'node:test'
import assert from 'node:assert/strict'
import { PoeCnStashClient } from '../electron/modules/chaosRecipe/stashClient.js'

test('仅经验采样查询选定角色详情，角色列表刷新不额外查询', async () => {
  const client = new PoeCnStashClient({ getAuthStatus: () => ({ authenticated: true, accountName: 'account' }) })
  const calls = []
  client.request = async url => {
    calls.push(new URL(url))
    return url.includes('get-characters') ? [{ name: 's30、嘎嘎嘎', league: 'S30赛季', level: 98 }] : { character: { name: 's30、嘎嘎嘎', league: 'S30赛季', experience: 123456789 }, items: [{ privateData: 'not retained' }] }
  }
  assert.equal((await client.listCharacters())[0].experience, null)
  assert.equal(calls.length, 1)
  const result = await client.listCharacters({ experienceCharacterName: 's30、嘎嘎嘎' })
  assert.equal(result[0].experience, 123456789)
  assert.equal(calls.length, 3)
  assert.equal(calls.at(-1).searchParams.get('character'), 's30、嘎嘎嘎')
  assert.equal(JSON.stringify(result).includes('privateData'), false)
})

test('不使用其他角色或赛季的经验，也不将缺失值变成零', async () => {
  const client = new PoeCnStashClient({ getAuthStatus: () => ({ authenticated: true, accountName: 'account' }) })
  for (const character of [{ name: 'other', league: 'S30赛季', experience: 100 }, { name: '角色', league: '永久', experience: 100 }, { name: '角色', league: 'S30赛季' }]) {
    client.request = async url => url.includes('get-characters') ? [{ name: '角色', league: 'S30赛季' }] : { character }
    assert.equal((await client.listCharacters({ experienceCharacterName: '角色' }))[0].experience, null)
  }
})
