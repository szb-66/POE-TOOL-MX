export function isSuccessfulScriptStart(result) {
  return result?.success === true && Number.isInteger(result.processId) && result.processId > 0
}
