import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    const activeElement = useActiveElement()
    const w = getCurrentWebviewWindow()
    const { createSettingsWindow } = useSettingsWindow()

    // play/pause
    onKeyStrokeSafe('space', () => usePlayback().playPauseCurrentTrack(), { activeElement })

    onKeyStrokeSafe('meta_comma', () => createSettingsWindow(), { activeElement })

    if (w.label !== 'main')
      onKeyStrokeSafe(
        'escape',
        () => (HOT_LOADED_WINDOWS.includes(w.label) ? w.hide() : w.close()),
        { activeElement },
      )

    if (import.meta.dev) {
      onKeyStrokeSafe(
        'meta_r',
        () => {
          window.location.reload()
        },
        { activeElement },
      )
    }

    useEventListener('keydown', (e) => {
      const blacklist = [' ', 'backspace']
      if (blacklist.includes(e.key.toLowerCase()) && e.target === document.body) e.preventDefault()

      if (e.key.toLowerCase() === 'a' && e.metaKey && e.target === document.body) e.preventDefault()
    })
  },
})
