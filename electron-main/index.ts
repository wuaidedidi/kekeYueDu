import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
const customRequire = createRequire(import.meta.url);
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'


const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
// 优先使用 vite-plugin-electron 注入的实际地址，其次回退到 FRONTEND_PORT 或 3000
const DEV_SERVER_URL =
  VITE_DEV_SERVER_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// 全局兜底：避免主进程因端口占用弹出错误窗口
process.on('uncaughtException', (err: any) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Main process: 端口占用 (${err.code})，忽略异常以继续运行。`)
    return
  }
  console.error('Main process uncaughtException:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('Main process unhandledRejection:', reason)
})

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// 启用远程调试端口，便于使用外部浏览器 DevTools 连接渲染进程
app.commandLine.appendSwitch('remote-debugging-port', '9222')
// 提升 Electron 主/渲染进程日志输出
process.env.ELECTRON_ENABLE_LOGGING = 'true'
process.env.ELECTRON_ENABLE_STACK_DUMPING = 'true'

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../electron-preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// 创建窗口，没有渐变过渡效果
async function createWindow() {
  // 创建窗口
  win = new BrowserWindow({
    title: 'KeKe Reading',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: 2000,
    height: 1000,
    frame: false,
    show: true, // 直接显示窗口
    backgroundColor: '#ffffff', // 标准背景色
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // 窗口就绪后的事件处理
  win.once('ready-to-show', () => {
    console.log('Window is ready to show')
  })

  win.webContents.on('did-finish-load', () => {
    console.log('Renderer process has finished loading.')
  })

  // 在生产模式下也打开开发者工具
  win.webContents.openDevTools()

  win.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        'Failed to load:',
        validatedURL,
        'Error Code:',
        errorCode,
        'Description:',
        errorDescription
      )
    }
  )

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(`${DEV_SERVER_URL}/login`)
    // win.loadURL(`${DEV_SERVER_URL}/workspace/all-books`)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

// 应用准备好后创建窗口
app.whenReady().then(async () => {
  console.log('App is ready, creating window...')
  await ensureBackend()
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// ipcMain.handle('register-user', async (event, { username, password }) => {
//   const db = await connectDB();
//   try {
//     // 执行数据库插入操作
//     await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
//     return { success: true };
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// });

ipcMain.on('set-window-size', (event, { width, height }) => {
  if (win) {
    win.setSize(width, height)
  }
})

ipcMain.on('toggle-fullscreen', (event) => {
  if (win) {
    const isFullScreen = win.isFullScreen()
    win.setFullScreen(!isFullScreen)
  }
})

// 窗口控制逻辑
ipcMain.handle('minimize-window', () => {
  if (win) {
    win.minimize()
  }
})

ipcMain.handle('maximize-window', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.handle('close-window', () => {
  if (win) {
    // 直接关闭窗口，不使用淡出效果
    win.close()
  }
})
// 后端自检：如果端口可用则启动后端，否则认为已有后端实例在运行
async function ensureBackend() {
  const port = Number(process.env.PORT) || 7777
  const base = `http://localhost:${port}`
  try {
    // Node18+ 支持全局 fetch；尝试请求根路由或健康检查
    const res = await fetch(base, { method: 'GET' })
    if (res.ok) {
      console.log(`Backend already running at ${base}`)
      return
    }
  } catch (err) {
    console.log(`Backend not responding at ${base}, booting embedded server...`)
    try {
      const child = spawn('npm', ['run', 'server:dev'], {
        cwd: path.join(process.env.APP_ROOT!, '.'),
        env: process.env,
        stdio: 'inherit',
        shell: true,
      })
      child.on('error', (e) => console.error('Failed to spawn backend:', e))
    } catch (e) {
      console.error('Failed to start embedded backend:', e)
    }
  }
}
