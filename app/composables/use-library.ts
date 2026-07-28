import { sql } from 'kysely'

const LIBRARY_FOLDERS_KEY = 'library-folders'

export function useLibrary() {
  const { getFolderTracks, getTracksData, refreshTrackData } = useTrackData()

  async function getLibraryTracks() {
    const tracks = await $db().selectFrom('library_tracks').selectAll().execute()

    return await getTracksData(tracks.map(track => track.path))
  }

  const getLibraryFolders = () => useAsyncData(LIBRARY_FOLDERS_KEY, () => $db().selectFrom('library_folders').selectAll().execute(), { immediate: true })

  const { execute: addFolderToLibrary, isLoading: isAddingFolderToLibrary } = useAsyncState<void>(async (folderPath: string) => {
    const exists = await useTauriFsExists(folderPath)
    if (!exists)
      // TODO: show error toast
      return

    const { isDirectory } = await useTauriFsStat(folderPath)
    if (!isDirectory)
    // TODO: show error toast
      return

    await $db().insertInto('library_folders').values({
      path: folderPath,
    }).execute()

    const folderTracks = await getFolderTracks(folderPath)

    await addTracksToLibrary(folderTracks, {
      id: folderPath,
      type: 'folder',
    })

    refreshNuxtData(buildFolderInLibraryKey(folderPath))
    refreshTrackListForType('library')
    refreshLibraryFolders()
  }, void 0, { immediate: false })

  const { execute: removeFolderFromLibrary, isLoading: isRemovingFolderFromLibrary } = useAsyncState<void>(async (folderPath: string) => {
    const folderTracksSources = await $db()
      .selectFrom('library_tracks_source')
      .where('source_type', '=', 'folder')
      .where('source_id', '=', folderPath)
      .selectAll()
      .execute()

    await $db()
      .deleteFrom('library_tracks_source')
      .where('source_type', '=', 'folder')
      .where('source_id', '=', folderPath)
      .execute()

    const libraryTracksSources = await $db()
      .selectFrom('library_tracks_source')
      .where('source_id', 'is not', folderPath)
      .where('track_id', 'in', folderTracksSources.map(source => source.track_id))
      .selectAll()
      .execute()

    const tracksToDelete = folderTracksSources.filter(source => !libraryTracksSources.some(s => s.track_id === source.track_id))

    const deletedTracks = await $db()
      .deleteFrom('library_tracks')
      .where('id', 'in', tracksToDelete.map(source => source.track_id))
      .returning('path')
      .execute()

    // the tracks no longer have a date_added, so the cached file entries are stale
    await refreshTrackData(deletedTracks.map(track => track.path))

    await $db()
      .deleteFrom('library_folders')
      .where('path', '=', folderPath)
      .execute()

    clearNuxtData(buildFolderInLibraryKey(folderPath))
    refreshLibraryFolders()
    refreshTrackListForType('library')
  }, void 0, { immediate: false })

  const useFolderInLibrary = (folderPath: string) => useAsyncData(
    computed(() => buildFolderInLibraryKey(folderPath)),
    () => $db().selectFrom('library_folders').where('path', '=', folderPath).selectAll().executeTakeFirst(),
    { immediate: false },
  )

  async function addTracksToLibrary(tracks: FileEntry[], source: {
    type: 'folder' | 'playlist'
    id: string
  }) {
    await $db()
      .insertInto('library_tracks')
      .values(tracks.map(track => ({
        album: track.tags.TALB ?? null,
        artist: track.tags.TPE1 ?? null,
        date_added: sql<string>`CURRENT_TIMESTAMP`,
        filename: track.name,
        path: track.path,
        title: track.tags.TIT2 ?? null,
      })))
      .onConflict(conflict => conflict.doNothing())
      .returningAll()
      .execute()

    // get existing library tracks instead of returning from the first call because if a
    // conflict is found then the corresponding track will not be in the returning array
    const existingLibraryTracks = await $db()
      .selectFrom('library_tracks')
      .where('path', 'in', tracks.map(track => track.path))
      .selectAll()
      .execute()

    await $db()
      .insertInto('library_tracks_source')
      .values(existingLibraryTracks.map(track => ({
        source_id: source.id,
        source_type: source.type,
        track_id: track.id,
      })))
      .onConflict(conflict => conflict.doNothing())
      .execute()

    // date_added lives on the library row, so the cached file entries are now stale
    await refreshTrackData(existingLibraryTracks.map(track => track.path))

    refreshTrackListForType('library')

    return existingLibraryTracks
  }

  async function addLibraryTrackSource(opts: { sourceId: string, sourceType: 'folder' | 'playlist', trackId: number }) {
    const { sourceId, sourceType, trackId } = opts
    return $db()
      .insertInto('library_tracks_source')
      .values({
        source_id: sourceId,
        source_type: sourceType,
        track_id: trackId,
      })
      .onConflict(conflict => conflict.doNothing())
      .execute()
  }

  /** No-ops for tracks played from a folder that was never added to the library. */
  async function markTrackPlayed(path: string) {
    await $db()
      .updateTable('library_tracks')
      .set({ last_played: sql<string>`CURRENT_TIMESTAMP` })
      .where('path', '=', path)
      .execute()

    await refreshTrackData(path)
  }

  return {
    addFolderToLibrary,
    addLibraryTrackSource,
    addTracksToLibrary,
    getLibraryFolders,
    getLibraryTracks,
    isAddingFolderToLibrary,
    isRemovingFolderFromLibrary,
    markTrackPlayed,
    removeFolderFromLibrary,
    useFolderInLibrary,
  }
}

function buildFolderInLibraryKey(folderPath: string) {
  return `${folderPath}-in-library`
}

export function refreshLibraryFolders() {
  refreshNuxtData(LIBRARY_FOLDERS_KEY)
}
