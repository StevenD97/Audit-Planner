import type { PreloadApi } from '../../shared/ipc'

declare global {
  interface Window {
    api: PreloadApi
    menuEvents: {
      onNew: (cb: () => void) => void
      onOpen: (cb: () => void) => void
      onSave: (cb: () => void) => void
      onSaveAs: (cb: () => void) => void
    }
  }
}

export {}
