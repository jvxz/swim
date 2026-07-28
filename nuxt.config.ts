import vueDevTools from 'vite-plugin-vue-devtools'

export default defineNuxtConfig({
  $development: {
    app: {
      head: {
        script: [{ src: 'http://localhost:8098' }],
      },
    },
  },

  app: {
    head: {
      charset: 'utf-8',
      meta: [{ content: 'no', name: 'format-detection' }],
      title: 'swim',
      viewport: 'width=device-width, initial-scale=1',
    },
    layoutTransition: {
      mode: 'out-in',
      name: 'layout',
    },
    pageTransition: {
      mode: 'out-in',
      name: 'page',
    },
  },

  compatibilityDate: '2025-12-02',

  css: ['@/assets/css/globals.css'],

  dayjs: {
    plugins: ['duration'],
  },

  devServer: {
    host: '0.0.0.0',
  },

  devtools: {
    timeline: {
      enabled: true,
    },
  },

  dir: {
    modules: 'app/modules',
  },

  eslint: {
    config: {
      // `standalone: true` makes @nuxt/eslint supply the vue/ts base config that
      // @antfu/eslint-config used to. Formatting stays off — oxfmt owns it.
      formatters: false,
      standalone: true,
      stylistic: false,
    },
  },

  experimental: {
    payloadExtraction: 'client',
    typedPages: true,
  },

  ignore: ['**/src-tauri/**', '**/node_modules/**', '**/.output/**', '**/.nuxt/**', '**/.git/**'],

  imports: {
    dirs: ['types/**', 'constants/**', 'utils/**'],
    presets: [
      { package: 'scule' },
      {
        cache: true,
        from: 'defu',
        imports: [
          {
            as: '$defu',
            name: 'defu',
          },
        ],
      },
      {
        cache: true,
        from: 'vue-draggable-plus',
        imports: ['useDraggablePlus'],
      },
      {
        from: 'kysely',
        imports: [{ name: 'Selectable', type: true }],
      },
      {
        from: 'zod',
        imports: [
          'z',
          {
            as: 'zInfer',
            name: 'infer',
            type: true,
          },
        ],
      },
    ],
  },

  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    'reka-ui/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    'dayjs-nuxt',
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
  ],

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  routeRules: {
    '/playground': {
      appLayout: false,
    },
  },

  ssr: false,

  vite: {
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'dayjs', // CJS
        'dayjs/plugin/updateLocale', // CJS
        'dayjs/plugin/duration', // CJS
        'dayjs/plugin/relativeTime', // CJS
        'dayjs/plugin/utc', // CJS
        '@tauri-apps/api/webviewWindow',
        '@tauri-apps/plugin-fs',
        '@tauri-apps/api/path',
        '@tauri-apps/plugin-sql',
        'kysely',
        'kysely-dialect-tauri',
        '@tauri-apps/api/core',
        '@tauri-apps/api/event',
        '@tauri-apps/plugin-store',
        '@tauri-apps/api/menu',
        '@tauri-apps/plugin-dialog',
        '@tauri-store/pinia',
        'clsx',
        'tailwind-merge',
        '@crabnebula/tauri-plugin-drag',
        '@tauri-apps/plugin-os',
        'colorjs.io',
        'p-queue',
        'zod',
        '@tauri-apps/plugin-opener',
        '@vueuse/integrations/useFuse',
        '@iptv/playlist',
        'class-variance-authority',
        'vue-draggable-plus',
      ],
    },
    plugins: [vueDevTools()],
    server: {
      hmr: {
        host: '0.0.0.0',
        port: 3001,
        protocol: 'ws',
      },
      strictPort: true,
      watch: {
        ignored: [
          '**/src-tauri/**',
          '**/node_modules/**',
          '**/.output/**',
          '**/.nuxt/**',
          '**/.git/**',
        ],
      },
    },
  },
})
