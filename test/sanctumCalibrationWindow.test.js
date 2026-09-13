import test from 'node:test'
import assert from 'node:assert/strict'
import { withCalibrationGameWindow } from '../electron/modules/sanctum/calibrationWindow.js'

function fixture({ activationFails = false, minimizeFails = false } = {}) {
  const calls = []
  let minimized = false
  const main = { isDestroyed:()=>false, isMinimized:()=>minimized,
    restore:()=>{calls.push('restore');minimized=false}, show:()=>calls.push('show'),
    hide:()=>{throw new Error('不得隐藏任务栏入口')} }
  return { calls, options: { getMainWindow:()=>main,
    minimizeMainWindow:async()=>{calls.push('minimize');minimized=true;return !minimizeFails},
    activation:{activateGame:async()=>{calls.push('activateGame');return {success:!activationFails,code:'missing'}},
      gameFailureMessage:()=> '未找到游戏窗口', activateMain:async()=>{calls.push('activateMain');return {success:true}}} } }
}
test('截图前主动激活游戏，截图后恢复助手，任务栏入口不隐藏',async()=>{
  const f=fixture()
  assert.equal(await withCalibrationGameWindow(f.options,async()=>{f.calls.push('capture');return 'frame'}),'frame')
  assert.deepEqual(f.calls,['minimize','activateGame','capture','restore','show','activateMain'])
})
test('游戏激活失败或最小化失败仍恢复助手且不截图',async()=>{
  for(const options of [{activationFails:true},{minimizeFails:true}]){
    const f=fixture(options)
    await assert.rejects(withCalibrationGameWindow(f.options,async()=>{throw new Error('不应截图')}),/游戏窗口|最小化/)
    assert.deepEqual(f.calls.slice(-3),['restore','show','activateMain'])
    assert.equal(f.calls.includes('capture'),false)
  }
})
test('截图异常或取消时恢复窗口后再报告失败',async()=>{
  const f=fixture()
  await assert.rejects(withCalibrationGameWindow(f.options,async()=>{throw new Error('采集取消')}),/采集取消/)
  assert.deepEqual(f.calls.slice(-3),['restore','show','activateMain'])
})
