import { clearMocks, mockIPC, mockWindows } from '@tauri-apps/api/mocks'
import { afterEach, beforeAll, vi } from 'vitest'

import type { FileEntry } from '../../app/types/tauri-bindings'

vi.mock('@tauri-apps/api/menu', () => {
  return {
    Menu: {
      new: () =>
        Promise.resolve({
          setAsAppMenu: () => Promise.resolve(),
        }),
    },
    MenuItem: {
      new: () => Promise.resolve({}),
    },
    PredefinedMenuItem: {
      new: () => Promise.resolve({}),
    },
    Submenu: {
      new: () => Promise.resolve({}),
    },
  }
})

vi.mock('@tauri-apps/plugin-os', () => ({
  arch: () => 'arm',
  eol: () => '\n',
  exeExtension: () => '',
  family: () => 'unix',
  hostname: () => Promise.resolve('host'),
  locale: () => Promise.resolve('en-US'),
  platform: () => 'macos',
  type: () => 'macos',
  version: () => '15.7.3',
}))

beforeAll(() => {
  mockWindows('main', 'settings')

  mockIPC(
    (cmd, _args) => {
      if (cmd === 'get_track_data') {
        return {
          date_added: null,
          download_status: 'Local',
          duration: 100,
          extension: 'mp3',
          last_played: null,
          filename: 'title-artist.mp3',
          full_uri: '',
          is_playlist_track: false,
          name: 'title-artist',
          path: 'test/fixtures/title-artist.mp3',
          play_count: 0,
          primary_tag: null,
          tags: {},
          thumbnail_uri: '',
          valid: true,
        } satisfies FileEntry
      }
      if (cmd === 'plugin:store|load') return {}
      if (cmd === 'plugin:fs|exists') return false
      if (cmd === 'plugin:fs|remove') return undefined
      if (typeof cmd === 'string' && cmd.startsWith('plugin:')) return null
      return null
    },
    { shouldMockEvents: true },
  )
})

afterEach(() => {
  clearMocks()
})
