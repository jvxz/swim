import unocss from '@unocss/eslint-plugin'

import withNuxt from './.nuxt/eslint.config.mjs'

// Vite+ owns everything oxc can parse: `vp fmt` (oxfmt) formats *every* file type
// including `.vue`, and `vp lint` (oxlint + tsgolint) lints JS/TS. ESLint is kept
// only for the two things they cannot do — `.vue` semantic rules, since oxlint has
// no SFC parser, and UnoCSS utility-class ordering.
//
// The `lint` script targets `**/*.vue` explicitly; do not widen it back to `.` or
// ESLint will start duplicating oxlint on every TS file again.
export default withNuxt(
  {
    ...unocss.configs.flat,
    files: ['**/*.vue'],
  },
  {
    files: ['**/*.vue'],
    rules: {
      // @nuxt/eslint's standalone base is stricter than @antfu/eslint-config was.
      // These are the rules antfu had off or relaxed, kept that way so swapping the
      // base config does not turn 30-odd untouched SFCs red.
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTaggedTemplates: true,
          allowTernary: true,
        },
      ],
      '@typescript-eslint/unified-signatures': 'off',
      'vue/html-self-closing': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/sort-keys': 'warn',
    },
  },
)
