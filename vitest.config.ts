import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

// Deliberately NOT folded into the `test` block of `vite.config.ts`, which is the
// Vite+ default. `defineVitestProject` is an async @nuxt/test-utils helper that wires
// up the `nuxt` environment; `vp migrate` detects this and leaves the upstream
// `vitest` imports alone. Vitest prefers this file over `vite.config.ts`, so `vp test`
// picks it up. Keep the direct `vitest` dependency for the same reason.

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          include: ['test/unit/*.{test,spec}.ts'],
          name: 'unit',
        },
      },
      await defineVitestProject({
        test: {
          environment: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          name: 'nuxt',
          setupFiles: ['test/setup/nuxt.tauri.ts'],
        },
      }),
    ],
  },
})
