import { randomUUID } from 'node:crypto'

// Invoke recording immediately so eligibility/time are captured on receipt,
// while retaining all writes until the batch's terminal notification.
export function createStashStatisticsBatch(record, report = () => {}) {
  const batchId = randomUUID()
  const pending = []
  let sequence = 0
  let statisticsError = ''
  function failed(error) {
    statisticsError = '统计保存失败'
    try { report(error) } catch { /* Diagnostics must not reject the batch. */ }
  }
  return {
    record(item) {
      const id = `${batchId}:${++sequence}`
      try { pending.push(Promise.resolve(record(item, id)).catch(failed)) } catch (error) { failed(error) }
    },
    async finish() {
      await Promise.all(pending)
      return { statisticsError }
    }
  }
}
