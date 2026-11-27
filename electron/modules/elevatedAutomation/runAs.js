import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const PIPE_PATTERN = /^\\\\\.\\pipe\\PoECNHelper\.ElevatedAutomation\.[A-Za-z0-9._-]{8,128}$/u

export class ElevatedRunAsError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'ElevatedRunAsError'
    this.code = code
    if (details !== undefined) this.details = details
  }
}

function absoluteWindowsPath(value, label) {
  if (typeof value !== 'string' || !path.win32.isAbsolute(value) || /[\0\r\n"]/u.test(value)) {
    throw new ElevatedRunAsError('INVALID_RUNAS_PATH', `${label}必须是固定 Windows 绝对路径`)
  }
  return path.win32.normalize(value)
}

function utf8Base64(value) {
  return Buffer.from(String(value), 'utf8').toString('base64')
}

export function createSessionPipeName() {
  return `\\\\.\\pipe\\PoECNHelper.ElevatedAutomation.${randomUUID().replaceAll('-', '')}`
}

export function buildRunAsInvocation({
  pythonPath,
  hostPath,
  resourceRoot,
  pipeName,
  parentProcessId,
  powershellPath = null,
  systemRoot = process.env.SystemRoot || process.env.WINDIR
} = {}) {
  const python = absoluteWindowsPath(pythonPath, 'Python 路径')
  const host = absoluteWindowsPath(hostPath, 'Host 路径')
  const resources = absoluteWindowsPath(resourceRoot, '资源根')
  if (!PIPE_PATTERN.test(pipeName)) throw new ElevatedRunAsError('INVALID_PIPE_NAME', '命名管道名称无效')
  if (!Number.isSafeInteger(parentProcessId) || parentProcessId <= 0 || parentProcessId > 0xffffffff) {
    throw new ElevatedRunAsError('INVALID_PARENT_PROCESS', '父进程标识无效')
  }
  const powershell = absoluteWindowsPath(
    powershellPath || path.win32.join(String(systemRoot || ''), 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    'PowerShell 路径'
  )
  const descriptor = utf8Base64(JSON.stringify({
    schemaVersion: 1,
    pipeName,
    parentProcessId,
    resourceRoot: resources
  }))
  const script = [
    "$ErrorActionPreference='Stop'",
    "$ProgressPreference='SilentlyContinue'",
    '$utf8=[System.Text.UTF8Encoding]::new($false,$true)',
    `$python=$utf8.GetString([Convert]::FromBase64String('${utf8Base64(python)}'))`,
    `$hostExe=$utf8.GetString([Convert]::FromBase64String('${utf8Base64(host)}'))`,
    `$descriptor='${descriptor}'`,
    '$arguments=\'-I "\'+$hostExe+\'" --descriptor-base64 "\'+$descriptor+\'"\'',
    '$process=Start-Process -FilePath $python -ArgumentList $arguments -Verb RunAs -WindowStyle Hidden -PassThru',
    "if($null -eq $process -or $process.Id -le 0){throw 'Host PID unavailable'}",
    '$line=\'ELEVATED_AUTOMATION_PID={0}\' -f $process.Id',
    '$bytes=[System.Text.Encoding]::UTF8.GetBytes($line+[char]10)',
    '$stream=[Console]::OpenStandardOutput(); $stream.Write($bytes,0,$bytes.Length); $stream.Flush()'
  ].join(';')
  return Object.freeze({
    file: powershell,
    args: Object.freeze([
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      Buffer.from(script, 'utf16le').toString('base64')
    ]),
    options: Object.freeze({
      windowsHide: true,
      encoding: 'utf8',
      timeout: 60_000,
      maxBuffer: 1024 * 1024
    })
  })
}

function cancelled(error) {
  const code = Number(error?.code ?? error?.errno)
  const message = `${error?.message || ''}\n${error?.stderr || ''}`
  return code === 1223 || /(?:cancel(?:led|ed)|operation was canceled|用户取消|操作已取消)/iu.test(message)
}

export async function launchElevatedHostWithPowerShell(invocation, { execFileImpl = execFileAsync } = {}) {
  try {
    const result = await execFileImpl(invocation.file, invocation.args, invocation.options)
    const stdout = String(result?.stdout || '').replace(/\0+/gu, '')
    const match = /ELEVATED_AUTOMATION_PID=([1-9][0-9]{0,9})/u.exec(stdout)
    const processId = match ? Number(match[1]) : 0
    if (!Number.isSafeInteger(processId) || processId <= 0 || processId > 0xffffffff) {
      throw new ElevatedRunAsError('HOST_PID_UNAVAILABLE', '高权限自动化 Host 未返回有效进程标识')
    }
    return { processId }
  } catch (error) {
    if (error instanceof ElevatedRunAsError) throw error
    if (cancelled(error)) throw new ElevatedRunAsError('ELEVATION_CANCELLED', '用户取消了管理员授权，无法向管理员权限游戏发送操作')
    throw new ElevatedRunAsError('ELEVATION_FAILED', '无法启动高权限自动化 Host', {
      reason: error?.message || '未知错误'
    })
  }
}
