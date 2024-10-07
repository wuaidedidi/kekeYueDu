import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import electron from 'vite-plugin-electron/simple'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig({
  server: {
    host: 'localhost',
    port: 3000,
  },
  plugins: [
    vue(),
    commonjs({
      dynamicRequireTargets: [
        path.resolve(__dirname, 'build/node_sqlite3.node'), // 确保路径正确
      ],
      ignoreDynamicRequires: false, // 可以尝试设置为 false
    }),
    electron({
      main: {
        entry: 'electron-main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              output: {
                dir: 'dist/electron-main',
                format: 'cjs',
              },
              external: [
                'sqlite3', // 确保 sqlite3 被外部化
                'bcrypt',
                'server/*',
              ],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, './electron-preload/index.ts'),
        vite: {
          build: {
            rollupOptions: {
              output: {
                dir: 'dist/electron-preload',
                format: 'cjs',
              },
            },
          },
        },
      },
    }),
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
  optimizeDeps: {
    include: ['sqlite3', 'axios'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
