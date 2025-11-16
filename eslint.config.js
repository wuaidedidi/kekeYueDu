import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    name: 'kekeYueDu App Files',
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // 通用规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',

      // Vue 规则
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    name: 'kekeYueDu Server Files (CommonJS)',
    files: ['server/**/*.cjs', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // 数据库相关
        db: 'writable',
        // Express 相关
        app: 'writable',
        router: 'writable',
        req: 'readonly',
        res: 'readonly',
        next: 'readonly',
        // JWT 相关
        jwt: 'readonly',
        bcrypt: 'readonly',
        // 其他全局变量
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // 服务端允许 console.log
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off', // 关闭未定义变量检查（全局变量）
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    name: 'kekeYueDu Electron Files',
    files: ['electron-main/**/*.js', 'electron-preload/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Electron API
        BrowserWindow: 'readonly',
        app: 'readonly',
        ipcMain: 'readonly',
        shell: 'readonly',
        Menu: 'readonly',
        MenuItem: 'readonly',
        // Node.js API
        fs: 'readonly',
        path: 'readonly',
        url: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'off',
    },
  },
  {
    name: 'kekeYueDu Ignore Patterns',
    ignores: [
      'dist*/**',
      'release/**',
      'node_modules/**',
      '*.d.ts',
      'coverage/**',
      '.nuxt/**',
      '.output/**',
    ],
  },
]