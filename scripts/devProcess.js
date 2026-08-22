import { DEVELOPMENT_RESTART_EXIT_CODE } from '../electron/modules/lifecycle/restart.js'

export async function runManagedElectronSession({
  launchElectron,
  closeServer,
  restartExitCode = DEVELOPMENT_RESTART_EXIT_CODE
}) {
  try {
    while (true) {
      const exitCode = await launchElectron()
      if (exitCode !== restartExitCode) return exitCode
    }
  } finally {
    await closeServer()
  }
}
