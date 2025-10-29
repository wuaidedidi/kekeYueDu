import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import electron from 'vite-plugin-electron/simple'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// import commonjs from '@rollup/plugin-commonjs'

export default defineConfig({
  base: './',
  server: {
    host: 'localhost',
    port: 3000,
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('trix-')
        }
      }
    }),
    // commonjs({
    //   dynamicRequireTargets: [
    //     path.resolve(__dirname, 'build/node_sqlite3.node'), // 确保路径正确
    //   ],
    //   ignoreDynamicRequires: false, // 可以尝试设置为 false
    //   include: /node_modules/, // 确保 node_modules 中的 commonjs 模块能够被正确处理
    // }),
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
                'element-plus',
                'dayjs',
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
      dayjs: path.resolve(__dirname, 'node_modules/dayjs'), // 使用正确路径
    },
  },
  optimizeDeps: {
    include: ['sqlite3', 'axios', 'element-plus', 'dayjs'],
  },
  //控制的是前端的打包流程
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // 禁用压缩
    sourcemap: true, // 启用 source map 方便调试
    rollupOptions: {
      plugins: [],
      external: [
        'dayjs/plugin/customParseFormat', // 将 dayjs 插件外部化
      ],
    },
  },
})
