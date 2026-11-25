import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isNodeTest = Boolean(process.env.NODE_TEST_CONTEXT)

export default defineConfig({
  base: './',
  // SSR 测试不能改写正在运行的开发服务器依赖缓存。
  cacheDir: isNodeTest ? path.resolve(__dirname, 'node_modules/.vite-test', String(process.pid)) : undefined,
  plugins: [
    vue(),
    AutoImport({
      dts: false,
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      dts: false,
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    open: false,
    warmup: isNodeTest ? undefined : {
      clientFiles: [
        './src/main.js',
        './src/App.vue',
        './src/components/Layout/MainLayout.vue',
        './src/domains/dashboard/DashboardRouteView.vue',
        './src/domains/settings/CoordinatePickerView.vue',
        './src/domains/priceCheck/PriceCheckOverlayView.vue'
      ]
    },
    watch: {
      ignored: [
        '**/.agents/**',
        '**/.cache/**',
        '**/.claude/**',
        '**/.codex/**',
        '**/.cursor/**',
        '**/.github/**',
        '**/.opencode/**',
        '**/.runtime/**',
        '**/artifacts/**',
        '**/build/**',
        '**/cloudbase/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/dist-electron-aliyun-test/**',
        '**/docs/**',
        '**/electron/**',
        '**/electron/assets/crafting-raw/**',
        '**/electron/assets/skill-raw/**',
        '**/electron/assets/unique-items-raw/**',
        '**/openspec/**',
        '**/scripts/**',
        '**/src/assets/models/**',
        '**/src/assets/scripts/**',
        '**/test/**',
        '**/test-support/**',
        '**/training-output/**'
      ]
    }
  },
  optimizeDeps: {
    noDiscovery: isNodeTest,
    entries: isNodeTest ? undefined : [
      'index.html',
      'src/domains/dashboard/DashboardView.vue'
    ],
    include: isNodeTest ? [] : [
      'vue',
      'pinia',
      'vue-router',
      'element-plus',
      '@element-plus/icons-vue',
      'element-plus/es/components/*/style/css',
      'element-plus/es/components/message/style/css'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
