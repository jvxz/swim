import path from 'node:path'

import { expect } from '@wdio/globals'

import type { FileEntry } from '../../../app/types/tauri-bindings'
import { getAudioFixtures } from '../utils/constants'
import { $invoke } from '../utils/invoke'

describe('tauri invoke commands', () => {
  for (const test of getAudioFixtures()) {
    it(`successfully invokes get_track_data command & returns correct data for ${path.basename(test.path)}`, async () => {
      const trackData = await $invoke<FileEntry>('get_track_data', {
        pathString: test.path,
        refresh: false,
      })

      expect(trackData?.valid).toBe(true)

      for (const [key, value] of Object.entries(test.tags)) expect(trackData?.tags[key]).toBe(value)
    })
  }
})
