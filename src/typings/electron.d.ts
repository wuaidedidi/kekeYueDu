declare global {
  interface Window {
    electronAPI: {
      exitWin: () => void
      maxSetWin: () => void
      minSetWin: () => void
      fullSetWin: () => void
      exitFull: () => void
    }
  }
}

export {}
