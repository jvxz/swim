export const SETTINGS_WINDOW_TABS = [
  'general',
  'playback',
  'library',
  'layout',
  'appearance',
  'lastFm',
  'advanced',
] as const

export const useSettingsWindow = createSharedComposable(() => {
  const tab = useState('settings-window-tab', () => SETTINGS_WINDOW_TABS[0])

  const { createWindow: createSettingsWindow, window: settingsWindow } = useTauriWindow(
    'settings',
    {
      center: true,
      height: 950,
      resizable: true,
      title: 'Settings',
      url: '/settings',
      width: 950,
    },
  )

  return {
    createSettingsWindow,
    settingsWindow,
    tab,
  }
})
