/** 将用户可读的快捷键转换为 Electron 支持的 accelerator。 */
export function toElectronAccelerator(accelerator) {
  if (typeof accelerator !== 'string') return accelerator
  return accelerator
    .trim()
    .split('+')
    .map(part => {
      const match = part.trim().match(/^numpad([0-9])$/i)
      return match ? `num${match[1]}` : part.trim()
    })
    .join('+')
}

