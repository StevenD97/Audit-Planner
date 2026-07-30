import type { PreloadApi } from '../../shared/ipc'

declare global {
  interface Window {
    // Both are undefined when running as a plain web page (no Electron
    // preload bridge) — see src/renderer/src/platform/index.ts.
    api?: PreloadApi
    menuEvents?: {
      onNew: (cb: () => void) => void
      onOpen: (cb: () => void) => void
      onSave: (cb: () => void) => void
      onSaveAs: (cb: () => void) => void
    }
  }
}

export {}
