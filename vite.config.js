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
        './src/domains/dashboard/DashboardRouteView.vue'
      ]
    },
    watch: {
      ignored: [
        '**/.runtime/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/electron/assets/crafting-raw/**',
        '**/electron/assets/skill-raw/**',
        '**/electron/assets/unique-items-raw/**',
        '**/training-output/**'
      ]
    }
  },
  optimizeDeps: {
    entries: isNodeTest ? undefined : [
      'index.html',
      'src/domains/dashboard/DashboardView.vue'
    ],
    include: [
      'vue',
      'pinia',
      'vue-router',
      'element-plus',
      '@element-plus/icons-vue',
      'element-plus/es/components/message/style/css'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})

