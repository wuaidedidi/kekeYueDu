import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
const customRequire = createRequire(import.meta.url);
customRequire('../../server/index.cjs');
import { fileURLToPath } from 'node:url'
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

// 开发服务器端口配置
const DEV_PORT = process.env.DEV_PORT || 3000
const DEV_SERVER_URL = `http://localhost:${DEV_PORT}`

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../electron-preload/index.js')
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
app.whenReady().then(() => {
  console.log('App is ready, creating window...')
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
