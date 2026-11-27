import { readFile } from 'node:fs/promises'
import { NtExecutable, NtExecutableResource } from 'resedit'

const WINDOWS_MANIFEST_RESOURCE_TYPE = 24
const WINDOWS_APPLICATION_MANIFEST_ID = 1
const EXECUTION_LEVEL_PATTERN = /<requestedExecutionLevel\b([^>]*)>/giu
const LEVEL_ATTRIBUTE_PATTERN = /\blevel\s*=\s*(["'])([^"']+)\1/iu

export class WindowsExecutableManifestError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'WindowsExecutableManifestError'
    this.code = code
  }
}

export function parseRequestedExecutionLevel(manifestXml) {
  if (typeof manifestXml !== 'string' || manifestXml.length === 0) {
    throw new WindowsExecutableManifestError('MANIFEST_EMPTY', 'Windows 应用清单为空')
  }
  const tags = [...manifestXml.matchAll(EXECUTION_LEVEL_PATTERN)]
  if (tags.length !== 1) {
    throw new WindowsExecutableManifestError(
      'EXECUTION_LEVEL_COUNT_INVALID',
      `Windows 应用清单必须且只能声明一个 requestedExecutionLevel，实际为 ${tags.length}`
    )
  }
  const level = tags[0][1].match(LEVEL_ATTRIBUTE_PATTERN)?.[2]
  if (!level) {
    throw new WindowsExecutableManifestError(
      'EXECUTION_LEVEL_MISSING',
      'Windows 应用清单缺少 requestedExecutionLevel.level'
    )
  }
  return level
}

export async function readWindowsExecutableExecutionLevels(executablePath, {
  readFileImpl = readFile,
  executableParser = NtExecutable,
  resourceParser = NtExecutableResource
} = {}) {
  let executable
  try {
    const body = await readFileImpl(executablePath)
    executable = executableParser.from(body, { ignoreCert: true })
  } catch (error) {
    throw new WindowsExecutableManifestError(
      'EXECUTABLE_PARSE_FAILED',
      `无法解析 Windows 可执行文件：${error?.message || 'unknown'}`
    )
  }

  let manifests
  try {
    const resources = resourceParser.from(executable)
    manifests = resources.getResourceEntriesAsString(
      WINDOWS_MANIFEST_RESOURCE_TYPE,
      WINDOWS_APPLICATION_MANIFEST_ID
    )
  } catch (error) {
    throw new WindowsExecutableManifestError(
      'MANIFEST_RESOURCE_PARSE_FAILED',
      `无法读取 Windows 应用清单资源：${error?.message || 'unknown'}`
    )
  }
  if (!Array.isArray(manifests) || manifests.length === 0) {
    throw new WindowsExecutableManifestError(
      'MANIFEST_RESOURCE_MISSING',
      'Windows 可执行文件缺少 RT_MANIFEST/1 资源'
    )
  }
  return manifests.map(([language, manifestXml]) => ({
    language,
    level: parseRequestedExecutionLevel(manifestXml)
  }))
}

export async function assertWindowsExecutableAsInvoker(executablePath, options) {
  const entries = await readWindowsExecutableExecutionLevels(executablePath, options)
  const invalid = entries.filter(entry => entry.level !== 'asInvoker')
  if (invalid.length) {
    throw new WindowsExecutableManifestError(
      'EXECUTION_LEVEL_NOT_AS_INVOKER',
      `Windows 主程序清单不是 asInvoker：${invalid.map(entry => entry.level).join(', ')}`
    )
  }
  return entries
}
