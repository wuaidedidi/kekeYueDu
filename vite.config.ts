import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import electron from 'vite-plugin-electron/simple'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import cfg from './config'

const FRONT_PORT = 3000
const BACK_PORT = 5002
const SERVER_ORIGIN = `http://localhost:${BACK_PORT}`

export default defineConfig({
  base: './',
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
    minify: 'terser', // 启用压缩
    sourcemap: true, // 启用 source map 方便调试
    rollupOptions: {
      plugins: [],
      external: [
        'dayjs/plugin/customParseFormat', // 将 dayjs 插件外部化
      ],
      output: {
        // 代码分割配置
        manualChunks: {
          // 将 Vue 相关代码单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将 UI 库单独打包
          'ui-vendor': ['element-plus', '@element-plus/icons-vue'],
          // 将工具库单独打包
          'utils-vendor': ['axios', 'dayjs', 'echarts', 'marked']
        }
      }
    },
    // 优化资源
    assetsInlineLimit: 4096, // 小于4kb的资源内联为base64
    chunkSizeWarningLimit: 1000, // 块大小警告限制
  },
  // 开发服务器配置（统一端口策略 + 代理）
  server: {
    host: 'localhost',
    port: FRONT_PORT, // 开发环境固定 3000；测试/生产来自环境变量
    strictPort: false, // 端口冲突自动重试（Vite 内置）
    proxy: cfg.buildProxy(SERVER_ORIGIN),
  },
  // 预览服务器配置（与 dev 保持一致的端口规则）
  preview: {
    port: FRONT_PORT,
    strictPort: false,
  },
  // 将后端 Origin 注入到前端构建中，便于运行时统一读取
  define: {
    __SERVER_ORIGIN__: JSON.stringify(SERVER_ORIGIN),
  },
})
