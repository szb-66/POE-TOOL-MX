import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'

test('圣所地图标题未匹配：开启 report_unmatched 输出明确 false，默认无键，环境失配不产出', () => {
  const result = runPython(`
import sys, json, base64
sys.path.insert(0, 'src/assets/scripts')
import numpy as np, cv2
from interface_titles import match_titles
template = np.zeros((10, 20), np.uint8); template[:, :10] = 255
png = base64.b64encode(cv2.imencode('.png', template)[1]).decode()
env = {'width': 40, 'height': 30, 'dpi': 96}
entry = {'png': png, 'region': {'x': 5, 'y': 7, 'width': 20, 'height': 10}, 'environment': env}
miss = np.random.default_rng(7).integers(0, 256, (30, 40), dtype=np.uint8)
print(json.dumps({
  'default': match_titles(miss, {'sanctum-map': entry}, env),
  'explicit': match_titles(miss, {'sanctum-map': entry}, env, report_unmatched=True),
  'envMismatch': match_titles(miss, {'sanctum-map': entry}, {'width': 40, 'height': 30, 'dpi': 120}, report_unmatched=True)
}))`)
  assert.deepEqual(result.default, {})
  assert.deepEqual(result.explicit, { 'sanctum-map': { matched: false } })
  assert.deepEqual(result.envMismatch, {})
})
