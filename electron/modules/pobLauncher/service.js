import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { PHASES, errorMessage, diagnostic } from './errors.js'
import { MANAGEMENT, stat, readJson, writeJson, safePath, listFiles, isUserFile, recover, commitFiles } from './files.js'
import { resolveRelease, download, extractArchive } from './download.js'

export const PROGRAMS = { charm: 'PoeCharm3.exe', pob: 'PathOfBuildingCommunity-Portable/Path of Building.exe' }
const exec = promisify(execFile)
export async function isRunning(root) {
  if (process.platform !== 'win32') throw new Error('PoB 启动助手仅支持 Windows')
  let output
  try {
    output = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; @(Get-CimInstance Win32_Process -Filter \"Name='PoeCharm3.exe' OR Name='Path of Building.exe' OR Name='Update.exe'\" | Select-Object ExecutablePath) | ConvertTo-Json -Compress"],
    { windowsHide: true, timeout: 15000 })
  } catch { throw new Error('无法检查 PoB 运行状态，请稍后重试') }
  const paths = output.stdout.trim() ? JSON.parse(output.stdout) : []
  return (Array.isArray(paths) ? paths : [paths]).some(processInfo => {
    const file = processInfo?.ExecutablePath
    if (!file) throw new Error('无法确认进程路径，请关闭 PoB 后重试')
    const relative = path.relative(root.toLowerCase(), file.toLowerCase())
    return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
  })
}
export function launchProgram(root) {
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(root, PROGRAMS.charm), [], { cwd: root, detached: true, stdio: 'ignore', shell: false })
    child.once('error', error => reject(new Error(`PoeCharm 启动失败（${error.code || '未知错误'}）`)))
    child.once('spawn', () => { child.unref(); resolve() })
  })
}

export class PobLauncherService extends EventEmitter {
  constructor({ userData, resolve = resolveRelease, fetchArchive = download, extract = extractArchive,
    running = isRunning, launch = launchProgram, beforeWrite } = {}) {
    super()
    this.configFile = path.join(userData, 'pob-launcher.json')
    this.logFile = path.join(userData, 'logs', 'pob-launcher.log')
    this.logPending = Promise.resolve()
    Object.assign(this, { resolve, fetchArchive, extract, running, launch, beforeWrite })
    this.state = { directory: '', charm: { installed: false, version: '' }, pob: { installed: false, version: '' },
      busy: false, phase: 'idle', progress: null, message: '', error: '', warning: '', operationId: '', operation: '',
      revision: 0, stopping: false, cancellable: false, supported: process.platform === 'win32' }
    this.loaded = false
  }
  snapshot() { return structuredClone(this.state) }
  report(error, event = 'failure') {
    const record = diagnostic(error, { event, operationId: this.state.operationId, phase: this.state.phase })
    this.logPending = this.logPending.then(async () => {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true })
      await fs.appendFile(this.logFile, `${JSON.stringify(record)}\n`)
    }).catch(() => {})
  }
  patch(values) {
    Object.assign(this.state, values, { revision: this.state.revision + 1 })
    for (const listener of this.rawListeners('state')) {
      try { listener.call(this, this.snapshot()) } catch (error) { this.report(error, 'notification') }
    }
    return this.snapshot()
  }
  stop(operationId) {
    if (!this.state.busy || operationId !== this.state.operationId || !this.state.cancellable) {
      return { success: false, error: '当前操作不可停止或已结束', state: this.snapshot() }
    }
    if (!this.state.stopping) {
      this.patch({ stopping: true, message: '正在停止，请等待清理或回滚完成' })
      this.controller.abort(new DOMException('用户已停止操作', 'AbortError'))
    }
    return { success: true, state: this.snapshot() }
  }
  async load() {
    if (this.loaded) return
    const config = await readJson(this.configFile, {})
    this.state.directory = typeof config.directory === 'string' ? config.directory : ''
    this.loaded = true
  }
  async detect() {
    const root = this.state.directory
    let versions = {}
    if (root) {
      await safePath(root)
      versions = await readJson(await safePath(root, `${MANAGEMENT}/versions.json`), {})
    }
    for (const component of ['charm', 'pob']) {
      const installed = Boolean(root && (await stat(await safePath(root, PROGRAMS[component])))?.isFile())
      this.state[component] = { installed, version: installed && typeof versions[component] === 'string' ? versions[component] : '' }
    }
    return this.snapshot()
  }
  async recoverIfNeeded() {
    const root = this.state.directory
    if (root && await stat(await safePath(root, `${MANAGEMENT}/journal.json`))) {
      await this.assertStopped()
      this.patch({ phase: 'recovering', message: '正在恢复上次中断的更新' })
      if (await recover(root)) this.patch({ message: '已恢复上次中断的更新，原安装已还原' })
    }
  }
  async run(operation, kind = '', preserveOutcome = false) {
    if (this.state.busy) return { success: false, error: '已有操作进行中，请稍候', state: this.snapshot() }
    this.controller = new AbortController()
    const signal = this.controller.signal
    const outcome = preserveOutcome ? { phase: this.state.phase, error: this.state.error,
      operationId: this.state.operationId, operation: this.state.operation } : null
    this.patch(preserveOutcome ? { busy: true } : { busy: true, error: '', warning: '', progress: null, operation: kind,
      operationId: randomUUID(), stopping: false, cancellable: Boolean(kind), phase: 'idle' })
    try {
      await this.load()
      await operation(signal)
      this.patch(outcome || { phase: 'idle', progress: null })
    } catch (error) {
      this.report(error)
      const cancelled = signal.aborted && error?.name === 'AbortError'
      const message = kind ? `${PHASES[this.state.phase] || '操作'}失败：${errorMessage(error)}` : errorMessage(error)
      this.patch(cancelled ? { phase: 'cancelled', progress: null, message: '已停止，原安装和用户文件已保留', error: '' } :
        { phase: 'error', progress: null, error: message })
    } finally {
      this.patch({ busy: false, stopping: false, cancellable: false })
      this.controller = null
    }
    return { success: this.state.phase === 'idle', cancelled: this.state.phase === 'cancelled', error: this.state.error, state: this.snapshot() }
  }
  async getState() {
    if (this.state.busy) return { success: true, state: this.snapshot() }
    return this.run(async () => { await this.recoverIfNeeded(); await this.detect() }, '', true)
  }
  async setDirectory(value) {
    return this.run(async () => { await this.configureDirectory(value) })
  }
  async configureDirectory(value) {
    if (typeof value !== 'string') throw new Error('请选择有效目录')
    const input = value.trim()
    if (input && (!path.isAbsolute(input) || path.parse(input).root === path.resolve(input))) throw new Error('请选择完整的工具目录，不能使用磁盘根目录')
    const directory = input ? await safePath(path.resolve(input)) : ''
    if (directory && !(await stat(directory))?.isDirectory()) throw new Error('目录不存在，请先创建目录或通过选择目录新建')
    this.state.directory = directory
    await writeJson(this.configFile, { directory })
    this.patch({ message: directory ? '已关联目录' : '已清空关联，安装文件保留' })
    await this.recoverIfNeeded()
    await this.detect()
  }
  async pickDirectory(picker) {
    return this.run(async () => {
      const selected = await picker()
      if (selected) await this.configureDirectory(selected)
    })
  }
  async assertStopped() {
    if (await this.running(this.state.directory)) throw new Error('请先关闭此目录中的 PoeCharm、PoB 和更新程序，再重试')
  }
  async start() {
    return this.run(async () => {
      await this.recoverIfNeeded()
      await this.detect()
      if (!this.state.charm.installed || !this.state.pob.installed) throw new Error('请先安装或补齐 PoeCharm 与 PoB Portable')
      if (await this.running(this.state.directory)) { this.patch({ message: '此目录中的 PoB 已在运行' }); return }
      await this.launch(this.state.directory)
      this.patch({ message: '已启动 PoeCharm' })
    })
  }
  async install(mode = 'install', picker) {
    return this.run(async signal => {
      if (!['install', 'update'].includes(mode)) throw new Error('不支持的操作')
      if (!this.state.directory && mode === 'install' && picker) {
        const selected = await picker()
        signal.throwIfAborted()
        if (!selected) return
        await this.configureDirectory(selected)
      }
      const root = this.state.directory
      if (!root) throw new Error('请先选择安装目录')
      await this.recoverIfNeeded()
      await this.detect()
      if (mode === 'update' && (!this.state.charm.installed || !this.state.pob.installed)) throw new Error('请先点击安装补齐组件')
      await this.assertStopped()
      const components = ['charm', 'pob'].filter(key => mode === 'update' || !this.state[key].installed)
      this.patch({ phase: 'checking', message: '正在查询官方版本' })
      const releases = []
      for (const component of components) {
        signal.throwIfAborted()
        const release = await this.resolve(component, { signal })
        signal.throwIfAborted()
        if (this.state[component].version !== release.version) releases.push({ component, ...release })
      }
      if (!releases.length) { this.patch({ message: mode === 'update' ? '两个组件均已是最新版本' : '两个组件已安装，可直接启动' }); return }
      const base = await safePath(root, MANAGEMENT)
      await fs.mkdir(base, { recursive: true })
      const stage = await fs.mkdtemp(path.join(base, 'stage-'))
      let committed = false
      try {
        const entries = []
        const versions = { charm: this.state.charm.version, pob: this.state.pob.version }
        for (const release of releases) {
          const { component } = release
          const label = component === 'charm' ? 'PoeCharm' : 'PoB Portable'
          this.patch({ phase: 'downloading', message: `正在下载 ${label}`, progress: null })
          const archive = path.join(stage, `${component}.zip`)
          let lastUpdate = 0
          const operationId = this.state.operationId
          const reportProgress = progress => {
            if (signal.aborted || this.state.operationId !== operationId) return
            const phase = progress.phase || 'downloading'
            if (this.state.phase !== phase || Date.now() - lastUpdate > 150 || progress.percent === 100) {
              lastUpdate = Date.now()
              this.patch({ phase, message: `${label} · ${PHASES[phase]}`, progress })
            }
          }
          await this.fetchArchive(release, archive, progress => {
            reportProgress(progress)
          }, { signal })
          signal.throwIfAborted()
          this.patch({ phase: 'verifying', message: `${label} · 校验`, progress: null })
          const extracted = path.join(stage, component)
          await this.extract(archive, extracted, { signal, onProgress: reportProgress })
          signal.throwIfAborted()
          let source = extracted
          const executable = component === 'charm' ? PROGRAMS.charm : 'Path of Building.exe'
          if (!(await stat(path.join(source, executable)))?.isFile()) {
            const children = await fs.readdir(source, { withFileTypes: true })
            const candidates = []
            for (const child of children) {
              if (child.isDirectory() && (await stat(path.join(source, child.name, executable)))?.isFile()) candidates.push(child.name)
            }
            if (candidates.length !== 1) throw new Error(`${label} 安装包目录结构无效`)
            source = path.join(source, candidates[0])
          }
          const executableHeader = await fs.open(path.join(source, executable), 'r')
          try {
            const bytes = Buffer.alloc(2); await executableHeader.read(bytes, 0, 2, 0)
            if (bytes.toString() !== 'MZ') throw new Error(`${label} 程序校验失败`)
          } finally { await executableHeader.close() }
          for (const file of await listFiles(source, '', signal)) {
            signal.throwIfAborted()
            if (file.split('/')[0].toLowerCase() === MANAGEMENT) continue
            // PoeCharm's archive must not overwrite the separately managed PoB tree.
            if (component === 'charm' && file.split('/')[0].toLowerCase() === 'pathofbuildingcommunity-portable') continue
            const relative = component === 'charm' ? file : `PathOfBuildingCommunity-Portable/${file}`
            // Seed shipped defaults on a new installation; never replace existing user data.
            if (isUserFile(file) && await stat(await safePath(root, relative))) continue
            entries.push({ relative, source: path.join(source, file) })
          }
          versions[component] = release.version
        }
        await writeJson(path.join(stage, 'versions.json'), versions)
        entries.push({ relative: `${MANAGEMENT}/versions.json`, source: path.join(stage, 'versions.json') })
        await this.assertStopped()
        this.patch({ phase: 'installing', message: '正在备份并替换程序文件', progress: null })
        await commitFiles(root, entries, { signal, beforeWrite: this.beforeWrite, beforeCommit: () => this.assertStopped(),
          onRollback: () => this.patch({ phase: 'recovering', cancellable: false, progress: null, message: '正在回滚，请稍候' }),
          onCommitted: () => { committed = true; this.patch({ cancellable: false, stopping: false }) },
          onWarning: error => { this.report(error, 'cleanup'); this.patch({ warning: '更新已提交，管理记录清理失败；重新检测时会重试清理' }) },
          onProgress: (done, total) => {
          if (done % 25 === 0 || done === total) this.patch({ progress: { received: done, total, unit: 'files', percent: Math.min(99, Math.floor(done / total * 100)) } })
        } })
        try { await this.detect() } catch (error) { this.report(error, 'detect'); this.patch({ warning: '程序已更新，但状态检测失败，请重新检测' }) }
        this.patch({ message: `${mode === 'update' ? '更新' : '安装'}完成，可启动 PoeCharm；备份保存在所选目录的 ${MANAGEMENT}/backups` })
      } finally {
        // stage is generated beneath the verified management directory, never a caller-provided deletion target.
        if (path.dirname(stage) === base && path.basename(stage).startsWith('stage-')) {
          try { await fs.rm(stage, { recursive: true, force: true }) }
          catch (error) { this.report(error, 'cleanup'); this.patch({ warning: `${committed ? '程序已更新；' : ''}暂存文件清理失败，可稍后重试，安装文件未因此改变` }) }
        }
      }
    }, mode)
  }
}
