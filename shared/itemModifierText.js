// This clipboard display annotation is not part of a trade stat condition.
export function stripFixedValueAnnotation(value) {
  return String(value || '').split('\n').map(line => {
    const body = line.replace(/[ \t]*[—–][ \t]*(?:数值不可调整|無法使用的值|Unscalable Value)[ \t\r]*$/u, '')
    return body.trim() ? body : line
  }).join('\n')
}
