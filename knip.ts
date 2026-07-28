import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: [
        'app/router.options.ts!',
        'app/app.vue!',
        'app/error.vue!',
        'app/pages/**/*.vue!',
        'app/components/**/*.vue!',
        'app/components/**/*.d.vue.ts!',
        'app/composables/**/*.ts!',
        'app/layouts/**/*.ts!',
        'app/middleware/**/*.ts!',
        'app/plugins/**/*.ts!',
        'app/utils/**/*.ts!',
        'server/**/*.ts!',
        'modules/**/*.ts!',
        'config/**/*.ts!',
        'shared/**/*.ts!',
        'scripts/**/*.ts',
      ],
      ignoreDependencies: [
        'vue-devtools',
        '@iconify-json/*',
        /** Needs to be explicitly installed, even though it is not imported, to avoid type errors. */
        'unplugin-vue-router',
        '@vueuse/shared',

        /** Some components import types from here, but installing it directly could lead to a version mismatch */
        'vue-router',
      ],
      ignoreUnresolved: ['#components', '#oauth/config'],
      project: ['**/*.{ts,vue,cjs,mjs}'],
    },
  },
}

export default config
