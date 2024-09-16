// src/typings/electron.d.ts
import 'electron'

declare global {
  interface Window {
    electronAPI: {
      getAppPath: () => Promise<string>
      pathJoin: (...args: string[]) => string
    }
  }
}
