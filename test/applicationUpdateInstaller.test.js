import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('更新安装使用可见 NSIS 窗口并在完成后重新运行', () => {
  const service = source('../electron/modules/update/service.js')
  assert.match(service, /quitAndInstall\(false, true\)/)
  assert.doesNotMatch(service, /quitAndInstall\(true, true\)/)
})

test('NSIS 更新页读取真实进度并保持全新安装配置', () => {
  const installer = source('../build/installer.nsh')
  const packageJson = JSON.parse(source('../package.json'))
  assert.equal(packageJson.build.nsis.oneClick, false)
  assert.equal(packageJson.build.nsis.allowToChangeInstallationDirectory, true)
  assert.equal(packageJson.build.nsis.include, 'build/installer.nsh')
  assert.match(installer, /\$\{isUpdated\}/)
  assert.match(installer, /customInstallMode/)
  assert.match(installer, /\$hasPerMachineInstallation == "1"/)
  assert.match(installer, /\$hasPerUserInstallation == "1"/)
  assert.match(installer, /PBM_GETPOS/)
  assert.match(installer, /PBM_GETRANGE/)
  assert.match(installer, /GetDlgItem \$4 \$3 1004/)
  assert.match(installer, /GetDlgItem \$5 \$3 1006/)
  assert.doesNotMatch(installer, /\$mui\.InstFilesPage/)
  assert.match(installer, /customFinishPage/)
  assert.match(installer, /\$applicationUpdateInstallSucceeded == "1"/)
  assert.match(installer, /\$INSTDIR\\\$\{APP_EXECUTABLE_FILENAME\}/)
  assert.doesNotMatch(installer, /\$launchLink/)
  assert.match(installer, /Call StartInstalledApplication\s+Abort/)
  assert.match(installer, /正在安装更新：\$2%/)
  assert.match(installer, /EnableWindow \$0 0/)
  assert.match(installer, /!ifndef BUILD_UNINSTALLER/)
  assert.ok(
    installer.indexOf('!macro customPageAfterChangeDir') < installer.indexOf('Function ShowApplicationUpdateProgress'),
    '进度函数必须延迟到页面宏展开后定义，避免早于 StdUtils 插件目录加载'
  )
})
