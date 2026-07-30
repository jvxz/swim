import { emit } from '@tauri-apps/api/event'
import { LazyStore } from '@tauri-apps/plugin-store'
import type { Selectable } from 'kysely'
import { sql } from 'kysely'

import type { LibraryTracks } from '~/types/db'

const LIBRARY_FOLDERS_KEY = 'library-folders'
const LIBRARY_FOLDERS_CHANGED_EVENT = 'library-folders-changed'
// keeps each insert/IN-clause well under SQLite's ~32,766 bind-variable limit
const LIBRARY_BATCH_SIZE = 500

const metadataBackfillStore = new LazyStore('library-metadata-backfill.json')

/** One-time pass populating genre/year/track_no/disc_no/composer/album_artist on rows
 * inserted before those columns existed. New rows get them at insert time. Callable from
 * anywhere that reads library_tracks (library view, smart playlists) so none of them can
 * see stale/unbackfilled rows depending on which one happens to load first. */
export async function backfillTrackMetadata() {
  if (await metadataBackfillStore.get('done')) return

  const { getTracksData } = useTrackData()
  const tracks = await $db().selectFrom('library_tracks').select(['path']).execute()

  const entries = await getTracksData(tracks.map((track) => track.path))

  await Promise.all(
    entries.map((entry) =>
      $db()
        .updateTable('library_tracks')
        .set(getTrackMetadataFields(entry.tags))
        .where('path', '=', entry.path)
        .execute(),
    ),
  )

  // getTracksData silently drops paths it couldn't read, and a cloud-only file that
  // isn't downloaded yet comes back with empty tags rather than being dropped - only
  // mark done once every row was actually read locally, so the rest get retried on
  // the next pass instead of staying null forever.
  const fullyCovered =
    entries.length === tracks.length && entries.every((entry) => entry.download_status === 'Local')

  if (fullyCovered) await metadataBackfillStore.set('done', true)
}

export function useLibrary() {
  const { getFolderTracks, getTracksData, refreshTrackData } = useTrackData()

  async function getLibraryTracks() {
    await backfillTrackMetadata()

    const tracks = await $db().selectFrom('library_tracks').selectAll().execute()

    return await getTracksData(tracks.map((track) => track.path))
  }

  const getLibraryFolders = () =>
    useAsyncData(
      LIBRARY_FOLDERS_KEY,
      () => $db().selectFrom('library_folders').selectAll().execute(),
      { immediate: true },
    )

  const { execute: addFolderToLibrary, isLoading: isAddingFolderToLibrary } = useAsyncState<void>(
    async (folderPath: string, deep = false) => {
      const exists = await useTauriFsExists(folderPath)
      if (!exists)
        // TODO: show error toast
        return

      const { isDirectory } = await useTauriFsStat(folderPath)
      if (!isDirectory)
        // TODO: show error toast
        return

      await $db()
        .insertInto('library_folders')
        .values({
          path: folderPath,
          recursive: deep ? 1 : 0,
        })
        .execute()

      const folderTracks = await getFolderTracks(folderPath, deep)

      await addTracksToLibrary(folderTracks, {
        id: folderPath,
        type: 'folder',
      })

      refreshNuxtData(buildFolderInLibraryKey(folderPath))
      refreshTrackListForType('library')
      void emit(LIBRARY_FOLDERS_CHANGED_EVENT)
    },
    void 0,
    { immediate: false },
  )

  const { execute: removeFolderFromLibrary, isLoading: isRemovingFolderFromLibrary } =
    useAsyncState<void>(
      async (folderPath: string) => {
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

        await pruneUnreferencedTracks(folderTracksSources.map((source) => source.track_id))

        await $db().deleteFrom('library_folders').where('path', '=', folderPath).execute()

        clearNuxtData(buildFolderInLibraryKey(folderPath))
        refreshTrackListForType('library')
        void emit(LIBRARY_FOLDERS_CHANGED_EVENT)
      },
      void 0,
      { immediate: false },
    )

  /** Deletes any of the given track ids that no longer have a remaining `library_tracks_source` row. */
  async function pruneUnreferencedTracks(candidateTrackIds: number[]) {
    if (candidateTrackIds.length === 0) return

    const stillReferenced = await $db()
      .selectFrom('library_tracks_source')
      .where('track_id', 'in', candidateTrackIds)
      .select('track_id')
      .execute()

    const referencedIds = new Set(stillReferenced.map((source) => source.track_id))
    const orphanIds = candidateTrackIds.filter((id) => !referencedIds.has(id))

    if (orphanIds.length === 0) return

    const deletedTracks = await $db()
      .deleteFrom('library_tracks')
      .where('id', 'in', orphanIds)
      .returning('path')
      .execute()

    // the tracks no longer have a date_added, so the cached file entries are stale
    await refreshTrackData(deletedTracks.map((track) => track.path))
  }

  /**
   * Re-scans a folder already in the library at a new depth: tracks that fall out of scope
   * are unlinked (and deleted if no other source references them), tracks newly in scope are
   * added, and tracks that remain in scope are left untouched so their date_added/last_played
   * survive the change.
   */
  async function setFolderScanDepth(folderPath: string, deep: boolean) {
    await $db()
      .updateTable('library_folders')
      .set({ recursive: deep ? 1 : 0 })
      .where('path', '=', folderPath)
      .execute()

    const currentTracks = await getFolderTracks(folderPath, deep)
    const currentPaths = new Set(currentTracks.map((track) => track.path))

    const linkedTracks = await $db()
      .selectFrom('library_tracks_source')
      .innerJoin('library_tracks', 'library_tracks.id', 'library_tracks_source.track_id')
      .where('library_tracks_source.source_type', '=', 'folder')
      .where('library_tracks_source.source_id', '=', folderPath)
      .select(['library_tracks.id', 'library_tracks.path'])
      .execute()

    const staleTrackIds = linkedTracks
      .filter((track) => !currentPaths.has(track.path))
      .map((track) => track.id)

    if (staleTrackIds.length > 0) {
      await $db()
        .deleteFrom('library_tracks_source')
        .where('source_type', '=', 'folder')
        .where('source_id', '=', folderPath)
        .where('track_id', 'in', staleTrackIds)
        .execute()

      await pruneUnreferencedTracks(staleTrackIds)
    }

    await addTracksToLibrary(currentTracks, { id: folderPath, type: 'folder' })

    refreshLibraryFolders()
  }

  const useFolderInLibrary = (folderPath: string) =>
    useAsyncData(
      computed(() => buildFolderInLibraryKey(folderPath)),
      () =>
        $db()
          .selectFrom('library_folders')
          .where('path', '=', folderPath)
          .selectAll()
          .executeTakeFirst(),
      { immediate: false },
    )

  async function addTrackBatch(
    tracks: FileEntry[],
    source: {
      type: 'folder' | 'playlist'
      id: string
    },
  ): Promise<Selectable<LibraryTracks>[]> {
    await $db()
      .insertInto('library_tracks')
      .values(
        tracks.map((track) => ({
          ...getTrackMetadataFields(track.tags),
          album: track.tags.TALB ?? null,
          artist: track.tags.TPE1 ?? null,
          date_added: sql<string>`CURRENT_TIMESTAMP`,
          filename: track.name,
          path: track.path,
          title: track.tags.TIT2 ?? null,
        })),
      )
      .onConflict((conflict) => conflict.doNothing())
      .returningAll()
      .execute()

    // get existing library tracks instead of returning from the first call because if a
    // conflict is found then the corresponding track will not be in the returning array
    const existingLibraryTracks = await $db()
      .selectFrom('library_tracks')
      .where(
        'path',
        'in',
        tracks.map((track) => track.path),
      )
      .selectAll()
      .execute()

    await $db()
      .insertInto('library_tracks_source')
      .values(
        existingLibraryTracks.map((track) => ({
          source_id: source.id,
          source_type: source.type,
          track_id: track.id,
        })),
      )
      .onConflict((conflict) => conflict.doNothing())
      .execute()

    return existingLibraryTracks
  }

  async function addTracksToLibrary(
    tracks: FileEntry[],
    source: {
      type: 'folder' | 'playlist'
      id: string
    },
  ) {
    const existingLibraryTracks: Selectable<LibraryTracks>[] = []

    for (let i = 0; i < tracks.length; i += LIBRARY_BATCH_SIZE) {
      const batch = tracks.slice(i, i + LIBRARY_BATCH_SIZE)
      existingLibraryTracks.push(...(await addTrackBatch(batch, source)))
    }

    // date_added lives on the library row, so the cached file entries are now stale
    await refreshTrackData(existingLibraryTracks.map((track) => track.path))

    refreshTrackListForType('library')

    return existingLibraryTracks
  }

  async function addLibraryTrackSource(opts: {
    sourceId: string
    sourceType: 'folder' | 'playlist'
    trackId: number
  }) {
    const { sourceId, sourceType, trackId } = opts
    return $db()
      .insertInto('library_tracks_source')
      .values({
        source_id: sourceId,
        source_type: sourceType,
        track_id: trackId,
      })
      .onConflict((conflict) => conflict.doNothing())
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
    setFolderScanDepth,
    useFolderInLibrary,
  }
}

function buildFolderInLibraryKey(folderPath: string) {
  return `${folderPath}-in-library`
}

export function refreshLibraryFolders() {
  refreshNuxtData(LIBRARY_FOLDERS_KEY)
}

export { LIBRARY_FOLDERS_CHANGED_EVENT }
