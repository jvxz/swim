import { defineConfig, presetWind4, transformerDirectives } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { reset: false },
    }),
    presetAnimations,
  ],
  theme: {
    colors: {
      accent: 'var(--accent)',
      'accent-foreground': 'var(--accent-foreground)',
      background: 'var(--background)',
      border: 'var(--border)',
      card: 'var(--card)',
      'card-foreground': 'var(--card-foreground)',
      danger: 'var(--danger)',
      'danger-foreground': 'var(--danger-foreground)',
      foreground: 'var(--foreground)',
      input: 'var(--input)',
      muted: 'var(--muted)',
      'muted-foreground': 'var(--muted-foreground)',
      overlay: 'var(--overlay)',
      popover: 'var(--popover)',
      'popover-foreground': 'var(--popover-foreground)',
      primary: 'var(--primary)',
      'primary-foreground': 'var(--primary-foreground)',
      ring: 'var(--ring)',
      secondary: 'var(--secondary)',
      'secondary-foreground': 'var(--secondary-foreground)',
    },
    duration: {
      DEFAULT: '0.1s',
    },
    radius: {
      DEFAULT: 'var(--radius)',
      lg: 'calc(var(--radius) + 2px)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      xl: 'calc(var(--radius) + 4px)',
    },
    // shadow: {
    //   DEFAULT: '0 2.5px 3px 0 #00000015',
    //   lg: '0 2.5px 6px 0 #00000020',
    //   sm: '0 2.25px 3px 0 #00000012',
    // },
  },
  transformers: [transformerDirectives({ throwOnMissing: false })],
})
