import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import electron from 'vite-plugin-electron/simple'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

console.log(path.join(__dirname, './electron-main/index.ts'))
console.log(path.join(__dirname, './electron-preload/index.ts'))

export default defineConfig({
  server: {
    host: 'localhost', // 设置 VITE_DEV_SERVER_HOST
    port: 3000, // 设置 VITE_DEV_SERVER_PORT
  },
  plugins: [
    vue(),
    // Electron 插件配置

    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron-main/index.ts',
        vite: {
          build: {
            // 确保输出目录为 dist/electron-main
            rollupOptions: {
              output: {
                dir: 'dist/electron-main',
                format: 'cjs', // Electron 主进程需要 CommonJS 格式
              },
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`
        input: path.join(__dirname, './electron-preload/index.ts'),
      },
    }),

    // 自动导入 Element Plus 相关的插件配置
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true, // 默认情况下，若 outDir 在 root 目录下，则 Vite 会在构建时清空该目录
  },
})
