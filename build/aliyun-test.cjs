// Keep the internal feedback test installation separate from the public app.
const { build } = require('../package.json')

module.exports = {
  ...build,
  appId: 'com.exilehelper.app.aliyun-test',
  productName: '流放助手-阿里云测试',
  executableName: 'PoE-Helper-Aliyun-Test',
  electronDist: 'node_modules/electron/dist',
  artifactName: 'PoE-Helper-${version}-aliyun-test-${arch}-setup.${ext}',
  directories: { ...build.directories, output: 'dist-electron-aliyun-test' },
  extraMetadata: {
    name: 'poe-helper-aliyun-test',
    feedbackInternalTest: true
  },
  win: { ...build.win, requestedExecutionLevel: 'asInvoker', publish: null },
  nsis: { ...build.nsis, perMachine: false, runAfterFinish: false }
}
