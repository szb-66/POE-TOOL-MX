import net from 'node:net'

export const APPLICATION_INSTANCE_PIPE = '\\\\.\\pipe\\exile-helper-application-instance-v1'

function notifyExistingInstance(pipeName) {
  return new Promise((resolve) => {
    const socket = net.createConnection(pipeName)
    const finish = () => {
      socket.destroy()
      resolve()
    }
    socket.once('connect', () => {
      socket.end('show')
      resolve()
    })
    socket.once('error', finish)
    socket.setTimeout(1000, finish)
  })
}

export function acquireCrossProcessInstanceLock({
  pipeName = APPLICATION_INSTANCE_PIPE,
  onSecondInstance = () => {}
} = {}) {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.resume()
      socket.once('data', () => onSecondInstance())
      socket.once('error', () => {})
    })
    server.once('error', async (error) => {
      if (error?.code !== 'EADDRINUSE' && error?.code !== 'EACCES') {
        reject(error)
        return
      }
      await notifyExistingInstance(pipeName)
      resolve({ acquired: false, release: async () => {} })
    })
    server.listen(pipeName, () => {
      resolve({
        acquired: true,
        release: () => new Promise((done) => server.close(done))
      })
    })
  })
}
