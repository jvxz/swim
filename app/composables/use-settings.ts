type SettingsEntryKeyFormat = `${(typeof SETTINGS_WINDOW_TABS)[number]}`

export interface Settings {
  appearance: {
    ui: {
      scale: number
      spacing: number
      cornerRadius: number
    }
    font: {
      name: 'SYSTEM' | (string & {})
      weight: string
      variant: string
      casing: 'normal' | 'uppercase' | 'lowercase'
    }
    token: {
      background: string
      muted: string
      foreground: string
      primary: string
      border: string
      surface: string
    }
    presets: Record<string, Record<keyof Settings['appearance']['token'], string>>
  }
  general: {
    clickOutsideToDeselect: boolean
  }
  lastFm: {
    username: string | null
    doScrobbling: boolean
    doNowPlayingUpdates: boolean
    doOfflineScrobbling: boolean
  }

  layout: {
    allowResizing: boolean
    panel: Record<LayoutPanelKey, LayoutPanelSetting>
    element: LayoutElementSettings
  }
}

export type SettingsEntryKey = keyof Settings
export type SettingsEntryValue<T extends SettingsEntryKey> = Settings[T]

type EnforcedSettingsKeys<T extends Record<string, any>> = {
  [K in keyof T]: K extends SettingsEntryKeyFormat ? T[K] : never
}

export const DEFAULT_SETTINGS: EnforcedSettingsKeys<Settings> = {
  appearance: {
    font: {
      casing: 'normal',
      name: 'SYSTEM',
      variant: 'Normal',
      weight: '400',
    },
    presets: {
      Default: {
        background: '#080808',
        border: '#171717',
        foreground: '#C7C7C7',
        muted: '#1D1D1D',
        primary: '#5A907C',
        surface: '#0E0E0E',
      },
    },
    token: {
      background: '#080808',
      border: '#171717',
      foreground: '#C7C7C7',
      muted: '#1D1D1D',
      primary: '#5A907C',
      surface: '#0E0E0E',
    },
    ui: {
      cornerRadius: 0.25,
      scale: 1,
      spacing: 0.25,
    },
  },
  general: {
    clickOutsideToDeselect: true,
  },
  lastFm: {
    doNowPlayingUpdates: true,
    doOfflineScrobbling: true,
    doScrobbling: true,
    username: null,
  },
  layout: {
    allowResizing: true,
    element: defaultLayoutElementSettings,
    panel: {
      bottom: {
        elements: ['player'],
        elementSizes: [100],
        size: 12.5,
      },
      left: {
        elements: ['libraryView'],
        elementSizes: [100],
        size: 35,
      },
      main: {
        elements: ['trackList'],
        elementSizes: [100],
        size: 12.5,
      },
      right: {
        elements: ['coverArt'],
        elementSizes: [100],
        size: 35,
      },
      top: {
        elements: [],
        elementSizes: [],
        size: 12.5,
      },
    },
  },
}

export const useSettings = defineStore('settings', () => reactive(DEFAULT_SETTINGS), {
  tauri: {
    saveInterval: 500,
    saveOnChange: true,
    saveOnExit: true,
    saveStrategy: 'debounce',
    sync: true,
    syncInterval: 100,
    syncStrategy: 'debounce',
  },
})
