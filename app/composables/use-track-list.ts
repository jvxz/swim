export const TRACK_LIST_ITEM_HEIGHT = 34

const defaultData: TrackListInput = {
  deep: false,
  path: '',
  sortBy: 'TIT2',
  sortOrder: 'Asc',
  type: 'folder',
}

export const TRACK_LIST_VIRTUALIZATION_THRESHOLD = 400

export function useTrackListInput() {
  const tauri = useTauri()

  const newData = tauri.prefs.get('track-list-directory') as TrackListInput | undefined

  const state = useState<TrackListInput>('track-list-input', () => newData ?? defaultData)

  watch(state, (newData) => tauri.store.set('track-list-directory', newData))

  return state
}

export function useTrackList() {
  const trackListInput = useTrackListInput()
  const trackData = useTrackData()

  function getTrackList(input: Ref<TrackListInput>) {
    const key = computed(() => createTrackListInputKey(input.value))

    const asyncState = useAsyncState(async (fresh?: boolean) => {
      if (!trackData.trackListCache.has(key.value) || fresh)
        await getTrackListEntries(input.value, fresh)
    }, null)

    useTrackListRefresh.on(({ keys }) => {
      if (keys.includes(key.value)) asyncState.execute(0, true)
      else keys.forEach((k) => trackData.trackListCache.delete(k))
    })

    watch(key, () => asyncState.execute(0, true))

    const data = computed<TrackListEntry[]>((prev) => {
      const refs = trackData.trackListCache.get(key.value)

      if (!refs) return prev ?? []

      const fullTracks = refs.map((ref) => {
        const fileEntry = trackData.trackCache.get(ref.path)

        return {
          ...fileEntry,
          ...ref,
          play_count: fileEntry?.play_count,
        } as TrackListEntry
      })

      return fullTracks
    })

    const { results: searchResults } = useTrackListSearch(data, input)

    return {
      data: searchResults,
      ...asyncState,
    }
  }

  async function getTrackListEntries(input: TrackListInput, fresh?: boolean) {
    const key = createTrackListInputKey(input)

    const cachedEntries = trackData.trackListCache.get(key)
    if (cachedEntries && !fresh) return cachedEntries

    let tracks: TrackListEntry[] = []

    switch (input.type) {
      case 'folder': {
        tracks = (await trackData.getFolderTracks(input.path, input.deep)).map((entry) => ({
          ...entry,
          is_playlist_track: false as const,
        }))
        break
      }

      case 'playlist': {
        const playlistId = Number(input.path)
        const playlist = await $db()
          .selectFrom('playlists')
          .where('id', '=', playlistId)
          .select(['is_smart', 'rules'])
          .executeTakeFirst()

        if (playlist?.is_smart) {
          const { getSmartPlaylistTracks } = useSmartPlaylists()
          tracks = (await getSmartPlaylistTracks(playlist)).map((entry) => ({
            ...entry,
            is_playlist_track: false as const,
          }))
        } else {
          const { getPlaylistTracks } = useUserPlaylists()
          tracks = await getPlaylistTracks(playlistId)
        }
        break
      }

      case 'library': {
        const { getLibraryTracks } = useLibrary()
        tracks = (await getLibraryTracks()).map((entry: FileEntry) => ({
          ...entry,
          is_playlist_track: false as const,
        }))
        break
      }
    }

    const sortedTracks = sortTrackList(tracks, input)

    const entries: TrackListCacheEntry[] = sortedTracks.map((track) => {
      if (track.is_playlist_track) {
        return {
          added_at: track.added_at,
          id: track.id,
          is_playlist_track: true as const,
          path: track.path,
          playlist_id: track.playlist_id,
          position: track.position,
          track_id: track.track_id,
        }
      }

      return {
        is_playlist_track: false as const,
        path: track.path,
      }
    })

    trackData.trackListCache.set(key, entries)

    return entries
  }

  return {
    getTrackList,
    playlistData: trackListInput,
  }
}
