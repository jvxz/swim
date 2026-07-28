export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    const settings = useSettings()

    const styles = refDebounced(
      toRef(
        () => `
      html {
        font-size: calc(${settings.appearance.ui.scale} * 16px);
      }
    
      body {
        font-family: ${settings.appearance.font.name};
        font-weight: ${settings.appearance.font.weight};
        font-style: ${settings.appearance.font.variant};
      }

      * {
        text-transform: ${settings.appearance.font.casing};
      }

      :root {
        --background: ${settings.appearance.token.background};
        --foreground: ${settings.appearance.token.foreground};
        --primary: ${settings.appearance.token.primary};
        --border: ${settings.appearance.token.border};
        --card: ${settings.appearance.token.surface};
        --muted: ${settings.appearance.token.muted};

        --spacing: calc(0.1875rem + (${settings.appearance.ui.spacing} * 0.125rem));
        --radius: ${settings.appearance.ui.cornerRadius}rem;
      }
    `,
      ),
      750,
    )

    useStyleTag(styles)
  },
})
