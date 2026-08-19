export function isEmergencyCancellation(result) {
  return result?.canceled === true || result?.error?.code === 'EMERGENCY_STOPPED'
}
