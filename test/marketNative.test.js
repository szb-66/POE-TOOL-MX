import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { MarketHostClient } from '../electron/modules/marketLocalization/service.js'

const executable = path.resolve('.runtime/localization-helper/LocalizationHelper.exe')
test('已构建市集host验证跨提权的同用户管道权限、真实收发和首实例保护', { skip: process.platform !== 'win32' || !fs.existsSync(executable) }, async () => {
  const client = new MarketHostClient({ executable })
  try {
    const result = await client.request('self-test')
    assert.equal(result.passed, true)
    assert.ok(result.pipeSecurityCases >= 4, '缺少跨提权管道安全回归，请重新构建host')
    assert.ok(result.resumeCases >= 4, '缺少原会话恢复校验，请重新构建host')
  } finally { await client.close() }
})

test('已构建市集host用启用时相同校验器检查完整发布词库，拒绝带选项scope的占位符', { skip: process.platform !== 'win32' || !fs.existsSync(executable) }, async () => {
  const client = new MarketHostClient({ executable })
  const { rules } = JSON.parse(fs.readFileSync(path.resolve('electron/assets/market-localization/catalog.json'), 'utf8'))
  try {
    await assert.rejects(client.request('self-test', { rules: [{ section: 'filters', field: 'placeholder', scope: 'account', source: 'Tapez le nom du compte...', cn: '输入账号名称...' }] }), /选项范围规则无效/)
    const result = await client.request('self-test', { rules })
    assert.equal(result.validatedRules, rules.length, '控制组件未校验完整发布词库')
  } finally { await client.close() }
})
