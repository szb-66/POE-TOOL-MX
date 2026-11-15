/** Renderer compatibility boundary for bundled Python generation and Electron I/O. */
import craftingTemplate from '@/assets/scripts/crafting_template.py?raw'
import mapRollingTemplate from '@/assets/scripts/map_rolling_template.py?raw'
import { electronApi } from '@/api/electron.js'
import { currentServer } from '@/utils/serverContext.js'
import {
  generatePythonScript as generateItemScript,
  generateMapRollingScript as generateMapScript
} from './pythonScriptGenerator.js'

export function generatePythonScript(config) {
  return generateItemScript({ serverId: currentServer.id, ...config }, craftingTemplate)
}

export function generateMapRollingScript(config) {
  return generateMapScript({ serverId: currentServer.id, ...config }, mapRollingTemplate)
}

export async function executePythonScript(scriptPath, args = []) {
  return electronApi.script.executePython(scriptPath, args)
}

export async function savePythonScript(scriptContent, filePath) {
  return electronApi.file.save(filePath, scriptContent)
}
