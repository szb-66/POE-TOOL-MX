import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = relative => readFileSync(path.join(root, relative), 'utf8')

function filesUnder(relative, extension) {
  const directory = path.join(root, relative)
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) return filesUnder(child, extension)
    return entry.name.endsWith(extension) ? [child] : []
  })
}

test('Python 业务脚本只保留游戏前台校验，不再枚举或激活窗口', () => {
  const forbidden = /def (?:find_game_window|focus_game_window|activate_game_window)|\b(?:SetForegroundWindow|BringWindowToTop|AttachThreadInput)\b|activateGameWindow/
  for (const file of filesUnder('src/assets/scripts', '.py')) {
    assert.doesNotMatch(source(file), forbidden, file)
  }
})

test('游戏原生激活只存在于公共窗口激活模块', () => {
  const allowed = new Set([
    path.normalize('electron/modules/window/activation.js'),
    path.normalize('electron/modules/window/foregroundRestore.js')
  ])
  for (const file of filesUnder('electron/modules', '.js')) {
    if (allowed.has(path.normalize(file))) continue
    assert.doesNotMatch(source(file), /SetForegroundWindow|AttachThreadInput/, file)
  }
})

test('主窗口恢复业务不直接调用 focus，辅助窗口保持独立策略', () => {
  for (const file of [
    'electron/main.js',
    'electron/modules/window/manager.js',
    'electron/modules/faustus/manager.js',
    'electron/modules/puzzle/service.js',
    'electron/modules/ipc/window.js',
    'electron/modules/ipc/configurationGuide.js'
  ]) assert.doesNotMatch(source(file), /(?:main|mainWindow|existingWindow|window)\.focus\(\)/, file)

  assert.match(source('electron/modules/window/foregroundRestore.js'), /window\.focus\(\)/)
  assert.match(source('electron/modules/priceCheck/presentation.js'), /this\.window\.focus\(\)/)
  assert.match(source('electron/modules/chaosRecipe/auth.js'), /this\.loginWindow\.focus\(\)/)
})

test('所有创建自动化进程的主入口先调用公共游戏激活', () => {
  const expectations = new Map([
    ['electron/modules/ipc/python.js', 'activateGameWindow'],
    ['electron/modules/ipc/combat.js', 'activateGameWindow'],
    ['electron/modules/ipc/bag.js', 'activateGameWindow'],
    ['electron/modules/chaosRecipe/automation.js', 'windowActivation?.activateGame'],
    ['electron/modules/stashPickup/manager.js', 'windowActivation?.activateGame'],
    ['electron/modules/junfeng/manager.js', 'windowActivation?.activateGame'],
    ['electron/modules/puzzle/service.js', 'windowActivation?.activateGame'],
    ['electron/modules/faustus/manager.js', 'windowActivation?.activateGame']
  ])
  for (const [file, token] of expectations) assert.ok(source(file).includes(token), file)

  const ordered = [
    ['electron/modules/ipc/python.js', /activateGameWindow\('generated-automation'\)[\s\S]*fs\.writeFileSync\(scriptPath/],
    ['electron/modules/ipc/combat.js', /activateGameWindow\('combat-potion-start'\)[\s\S]*spawnCombatProcess/],
    ['electron/modules/ipc/bag.js', /activateGameWindow\('bag-auto-stash'\)[\s\S]*writeConfig\(fileWatcher, 'bag_stash_config\.json'/],
    ['electron/modules/chaosRecipe/automation.js', /activateGame\(\{ source: 'chaos-recipe-pickup' \}\)[\s\S]*this\.plan =/],
    ['electron/modules/stashPickup/manager.js', /activateGame\(\{ source: 'stash-pickup-start' \}\)[\s\S]*this\.writeConfig\(\)/],
    ['electron/modules/junfeng/manager.js', /activateGame\(\{ source: 'junfeng-pickup-start' \}\)[\s\S]*this\.writeConfig\(\)/],
    ['electron/modules/puzzle/service.js', /activateGame\(\{ source: 'puzzle-auto-placement' \}\)[\s\S]*fs\.writeFileSync\(configPath/],
    ['electron/modules/faustus/manager.js', /activateGame\(\{ source: 'faustus-start' \}\)[\s\S]*this\.spawnMode\('run'/]
  ]
  for (const [file, pattern] of ordered) assert.match(source(file), pattern, file)
})

test('renderer 不暴露任意窗口句柄或激活目标接口', () => {
  const preload = source('electron/preload.cjs')
  assert.doesNotMatch(preload, /ipcRenderer\.(?:invoke|send)\(['"](?:activate-(?:game|main)|window-activation|window-handle)/i)
})
