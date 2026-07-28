import path from 'node:path'

import type { FileEntry } from '../../../app/types/tauri-bindings'

export function getAudioFixtures(): { path: string; tags: FileEntry['tags'] }[] {
  const getPath = (filename: string) => path.resolve(process.cwd(), 'test/fixtures', filename)

  return [
    {
      path: getPath('TIT2.mp3'),
      tags: {
        TIT2: 'Title',
      },
    },
    {
      path: getPath('TIT2-TPE1.mp3'),
      tags: {
        TIT2: 'Title',
        TPE1: 'Artist',
      },
    },
    {
      path: getPath('TIT2-TPE1-TALB.mp3'),
      tags: {
        TALB: 'Album',
        TIT2: 'Title',
        TPE1: 'Artist',
      },
    },
    {
      path: getPath('TIT2-TPE1-TALB-COMM.mp3'),
      tags: {
        COMM: 'Comments',
        TALB: 'Album',
        TIT2: 'Title',
        TPE1: 'Artist',
      },
    },
  ]
}
