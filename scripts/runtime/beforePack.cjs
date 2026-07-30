const { execFileSync } = require('node:child_process')
const path = require('node:path')

module.exports = async function beforePack(context) {
  if (context.electronPlatformName !== 'win32' || context.arch !== 1) {
    throw new Error('公开版本只允许构建 Windows x64 安装包')
  }
  execFileSync(process.execPath, [path.join(__dirname, 'verify.js')], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    windowsHide: true
  })
}
