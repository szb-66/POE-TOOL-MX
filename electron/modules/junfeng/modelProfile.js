import fs from 'node:fs'
import path from 'node:path'

export function highlightModelPaths(root) {
  return { model: path.join(root, 'model.onnx'), manifest: path.join(root, 'manifest.json') }
}

export function resolveHighlightModelPaths(bundledRoot, profileRoot) {
  if (!profileRoot) return highlightModelPaths(bundledRoot)
  const profile = highlightModelPaths(profileRoot)
  // 半写入或损坏的独立模型必须显式报错，不能偷偷回退到另一套模型。
  return Object.values(profile).some(file => fs.existsSync(file)) ? profile : highlightModelPaths(bundledRoot)
}
