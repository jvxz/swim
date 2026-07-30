type CacheEntryKeysToOmit =
  | 'name'
  | 'filename'
  | 'tags'
  | 'thumbnail_uri'
  | 'full_uri'
  | 'extension'
  | 'primary_tag'
  | 'valid'
  | 'duration'
  | 'play_count'
  | 'date_added'
  | 'last_played'
  | 'download_status'
export type TrackListCacheEntry = Prettify<
  Omit<PlaylistEntry, CacheEntryKeysToOmit> | Omit<FolderEntry, CacheEntryKeysToOmit>
>

export const useTrackData = defineStore('track-data', () => {
  // path, file entry
  const trackCache = shallowReactive<Map<string, FileEntry>>(new Map())
  const trackListCache = shallowReactive<Map<string, TrackListCacheEntry[]>>(new Map())

  async function getTrackData(path: string) {
    const cachedTrack = trackCache.get(path)

    if (cachedTrack) return cachedTrack

    const track = await $invoke(commands.getTrackData, path, false)
    trackCache.set(path, track)

    return track
  }

  async function getFolderTracks(path: string) {
    const paths = await $invoke(commands.getFolderTrackPaths, path, false)
    return getTracksData(paths)
  }

  async function getTracksData(paths: string[]) {
    const tracks = await $invoke(commands.getTracksData, paths, false)

    tracks.forEach((track) => trackCache.set(track.path, track))

    return tracks
  }

  async function refreshTrackData(path: string[]): Promise<FileEntry[]>
  async function refreshTrackData(path: string): Promise<FileEntry>
  async function refreshTrackData(path: string | string[]) {
    if (Array.isArray(path)) {
      const tracks = await $invoke(commands.getTracksData, path, true)
      tracks.forEach((track) => trackCache.set(track.path, track))
      return tracks
    }

    const track = await $invoke(commands.getTrackData, path, true)
    trackCache.set(path, track)

    return track
  }

  function toTrackListEntry(entry: TrackListCacheEntry): TrackListEntry {
    try {
      const track = trackCache.get(entry.path)!

      if (entry.is_playlist_track) {
        return {
          ...entry,
          ...track,
          is_playlist_track: true as const,
        }
      }

      return {
        ...entry,
        ...track,
        is_playlist_track: false as const,
      }
    } catch (err) {
      emitError({
        data: `Failed to convert track list entry to track list entry: ${err}`,
        type: 'Other',
      })

      throw err
    }
  }

  return {
    getFolderTracks,
    getTrackData,
    getTracksData,
    refreshTrackData,
    toTrackListEntry,
    trackCache,
    trackListCache,
  }
})

export function refreshTrackListForType(type: TrackListInput['type'], path?: string) {
  const { trackListCache } = useTrackData()
  const keys = [...trackListCache.keys()].filter((k) => {
    if (type === 'library') return k.startsWith('library-')

    return path ? k.startsWith(`${type}-${path}-`) : k.startsWith(`${type}-`)
  })

  useTrackListRefresh.trigger({ keys })
}

export function createTrackListInputKey(input: TrackListInput) {
  if (input.type === 'library') return `library-${input.sortBy}-${input.sortOrder}`

  return `${input.type}-${input.path}-${input.sortBy}-${input.sortOrder}`
}

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTrackData, import.meta.hot))
