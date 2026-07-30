import type { PreloadApi } from '@shared/ipc'
import { browserPlatformApi, tryRestoreAutosavedWorkspace } from './browserPlatformApi'

/** True when running inside the Electron desktop shell (preload bridge present). */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && Boolean(window.api)
}

/**
 * Single entry point the renderer uses for all persistence/export — picks
 * the Electron IPC bridge when running as a desktop app, or the in-browser
 * implementation (sql.js + IndexedDB + file download/upload) when running
 * as a plain web page. Both implement the exact same `PreloadApi` contract
 * (src/shared/ipc.ts), so no feature screen needs to know which one it's
 * talking to.
 */
export function getPlatformApi(): PreloadApi {
  return isElectron() ? window.api! : browserPlatformApi
}

export { tryRestoreAutosavedWorkspace }
