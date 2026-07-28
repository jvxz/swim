import { defineConfig } from 'vite-plus'

// Nuxt owns the real Vite config for the app (nuxt.config.ts) and never reads this
// file. This is the single place for Vite+ format, lint and hook config.
//
// Division of labour:
//   oxfmt  via vp fmt  - formatting for every file type, including .vue
//   oxlint via vp lint - JS/TS lint plus type-aware checks
//   eslint via pnpm run lint - .vue only, since oxlint cannot parse SFCs
export default defineConfig({
  fmt: {
    ignorePatterns: [
      // Tool-managed; these get rewritten by beads/Claude Code, not by us.
      '.beads/**',
      '.claude/**',
      'app/types/db.ts',
      'app/types/tauri-bindings.ts',
      'app/utils/id3.ts',
      'src-tauri/**',
      'test/fixtures/**',
    ],
    semi: false,
    singleAttributePerLine: true,
    singleQuote: true,
    sortImports: true,
    sortPackageJson: true,
  },
  lint: {
    ignorePatterns: [
      'app/types/db.ts',
      'app/types/tauri-bindings.ts',
      'app/utils/id3.ts',
      // tsgolint resolves types from the root tsconfig, which is solution-style and
      // does not carry Nuxt's generated node types or wdio's mocha globals.
      // See music-test-vibe-y6b.
      'knip.ts',
      'nuxt.config.ts',
      'src-tauri/**',
      'test/e2e/**',
    ],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
  },
  staged: {
    '*': 'vp check --fix',
    '*.vue': 'eslint --fix',
  },
})
