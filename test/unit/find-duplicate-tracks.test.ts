import { describe, expect, it } from 'vitest'

import type { FileEntry } from '../../app/types/tauri-bindings'
import { durationKey, groupDuplicates, metadataKey } from '../../app/utils/find-duplicate-tracks'

function track(partial: Partial<FileEntry> & { path: string }): FileEntry {
  return {
    date_added: null,
    download_status: 'Local',
    duration: 0,
    extension: 'mp3',
    filename: partial.path,
    full_uri: '',
    is_playlist_track: false,
    last_played: null,
    name: partial.path,
    play_count: 0,
    primary_tag: null,
    tags: {},
    thumbnail_uri: '',
    valid: true,
    ...partial,
  }
}

describe('metadataKey', () => {
  it('matches on normalised artist + title + album', () => {
    const a = track({
      path: 'a',
      tags: { TPE1: 'Boards of Canada', TIT2: 'Roygbiv', TALB: 'MHTRTC' },
    })
    const b = track({
      path: 'b',
      tags: { TPE1: ' boards of canada ', TIT2: 'ROYGBIV', TALB: 'mhtrtc' },
    })
    expect(metadataKey(a)).toBe(metadataKey(b))
  })

  it('falls back to filename when no title tag', () => {
    expect(metadataKey(track({ path: 'song.mp3' }))).toBe(metadataKey(track({ path: 'song.mp3' })))
  })

  it('is empty when the track has no identifying data', () => {
    expect(metadataKey(track({ path: '', name: '' }))).toBe('')
  })

  it('separates fields unambiguously', () => {
    const ab = track({ path: '1', name: '', tags: { TPE1: 'a b', TIT2: 'c' } })
    const a = track({ path: '2', name: '', tags: { TPE1: 'a', TIT2: 'b c' } })
    expect(metadataKey(ab)).not.toBe(metadataKey(a))
  })
})

describe('durationKey', () => {
  it('rounds duration to the nearest second', () => {
    const a = track({ path: 'a', tags: { TIT2: 't' }, duration: 180.4 })
    const b = track({ path: 'b', tags: { TIT2: 't' }, duration: 180.1 })
    expect(durationKey(a)).toBe(durationKey(b))
  })

  it('distinguishes different durations', () => {
    const a = track({ path: 'a', tags: { TIT2: 't' }, duration: 180 })
    const b = track({ path: 'b', tags: { TIT2: 't' }, duration: 200 })
    expect(durationKey(a)).not.toBe(durationKey(b))
  })
})

describe('groupDuplicates', () => {
  it('returns only groups with more than one track, preserving order', () => {
    const tracks = [
      track({ path: 'a', tags: { TIT2: 'dup' } }),
      track({ path: 'unique', tags: { TIT2: 'solo' } }),
      track({ path: 'b', tags: { TIT2: 'dup' } }),
    ]
    const groups = groupDuplicates(tracks, metadataKey)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.tracks.map((t) => t.path)).toEqual(['a', 'b'])
  })

  it('skips tracks with an empty key', () => {
    const tracks = [track({ path: '', name: '' }), track({ path: '', name: '' })]
    expect(groupDuplicates(tracks, metadataKey)).toEqual([])
  })
})
