import { writeM3U } from '@iptv/playlist'
import {} from '@tauri-apps/api/path'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { sql } from 'kysely'

export function useUserPlaylists() {
  const router = useRouter()
  const route = useRoute()
  const { addTracksToLibrary } = useLibrary()
  const { getTrackData } = useTrackData()
  const { emitMessage } = useConsole()

  const { data: playlists, refresh: refreshPlaylistList } = useAsyncData<
    Selectable<DB['playlists']>[]
  >('playlists', () => $db().selectFrom('playlists').selectAll().execute(), {
    default: () => [],
    immediate: true,
  })

  async function createPlaylist(opts: { name: string }) {
    await $db()
      .insertInto('playlists')
      .values({
        name: opts.name,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    refreshPlaylistList()

    emitMessage({
      source: 'Sql',
      text: `Playlist "${opts.name}" created`,
      type: 'log',
    })
  }

  async function renamePlaylist(playlistId: number, name: string) {
    const originalName = getPlaylistName(playlistId)

    await $db()
      .updateTable('playlists')
      .set({
        name,
      })
      .where('id', '=', playlistId)
      .execute()

    refreshPlaylistList()
    refreshTrackListForType('playlist', String(playlistId))

    emitMessage({
      source: 'Sql',
      text: `Playlist "${originalName}" renamed to "${name}"`,
      type: 'log',
    })
  }

  async function deletePlaylist(playlistId: number) {
    const playlistName = getPlaylistName(playlistId)
    await $db().deleteFrom('playlists').where('id', '=', playlistId).execute()

    if ('id' in route.params && Number(route.params.id) === playlistId) router.back()

    refreshPlaylistList()

    emitMessage({
      source: 'Sql',
      text: `Playlist "${playlistName}" deleted`,
      type: 'log',
    })
  }

  async function getPlaylistTracks(playlistId: number): Promise<PlaylistEntry[]> {
    const playlistTracks = await $db()
      .selectFrom('playlist_tracks')
      .where('playlist_id', '=', playlistId)
      .selectAll()
      .orderBy('position', 'asc')
      .execute()

    const fileEntries: PlaylistEntry[] = await Promise.all(
      playlistTracks.map(async (track) => {
        const trackData = await getTrackData(track.path)
        return {
          ...trackData,
          ...track,
          is_playlist_track: true,
        } satisfies PlaylistEntry
      }),
    )

    return fileEntries
  }

  async function addToPlaylist(playlistId: number, tracks: FileEntry[]) {
    const validTracks = tracks.filter((track) => track.valid)
    if (!validTracks.length) {
      return emitError({
        data: 'No valid tracks to add to the playlist. Did you select any tracks?',
        type: 'Other',
      })
    }

    const invalidTracks = tracks.filter((track) => !track.valid)
    if (invalidTracks.length) {
      emitError({
        data: `Could not add the following tracks to the playlist: ${invalidTracks.map((track) => track.path).join(', ')}`,
        type: 'FileSystem',
      })
    }

    const libraryTracks = await addTracksToLibrary(validTracks, {
      id: String(playlistId),
      type: 'playlist',
    })

    await $db()
      .insertInto('playlist_tracks')
      .values(
        libraryTracks.map((track, idx) => ({
          name: track.filename,
          path: track.path,
          playlist_id: playlistId,
          position: (eb) =>
            eb
              .selectFrom('playlist_tracks')
              .select((eb) =>
                sql<number>`${eb.fn.coalesce(eb.fn.max('position'), eb.val(0))} + 1 + ${idx}`.as(
                  'pos',
                ),
              )
              .where('playlist_id', '=', playlistId)
              .limit(1),
          track_id: track.id,
        })),
      )
      .execute()

    refreshPlaylistList()
    refreshTrackListForType('playlist', String(playlistId))

    const playlistName = getPlaylistName(playlistId)
    emitMessage({
      source: 'Sql',
      text: `${validTracks.length} ${checkPlural(validTracks.length, 'tracks', 'track')} added to playlist "${playlistName}"`,
      type: 'log',
    })
  }

  async function removeFromPlaylist(tracks: PlaylistEntry[]) {
    const playlistId = tracks[0]?.playlist_id

    if (!playlistId) {
      return emitError({
        data: 'Attempted to remove tracks from an unknown playlist',
        type: 'Other',
      })
    }

    if (playlistId && tracks.some((track) => track.playlist_id !== playlistId)) {
      return emitError({
        data: 'Attempted to remove tracks from multiple playlists',
        type: 'Other',
      })
    }

    await $db()
      .deleteFrom('playlist_tracks')
      .where('playlist_id', '=', playlistId)
      .where(
        'track_id',
        'in',
        tracks.map((track) => track.track_id),
      )
      .execute()

    refreshPlaylistList()
    refreshTrackListForType('playlist', String(playlistId))
    refreshTrackListForType('library')

    const playlistName = getPlaylistName(playlistId)
    emitMessage({
      source: 'Sql',
      text: `${tracks.length} ${checkPlural(tracks.length, 'track', 'tracks')} removed from playlist "${playlistName}"`,
      type: 'log',
    })
  }

  async function checkPlaylistExists(playlistId: number) {
    const playlist = await $db()
      .selectFrom('playlists')
      .where('id', '=', playlistId)
      .selectAll()
      .executeTakeFirst()
    return playlist !== undefined
  }

  function getPlaylistName(playlistId: number) {
    return playlists.value.find((playlist) => playlist.id === playlistId)?.name
  }

  const exportPlaylistAsM3u = createUnrefFn(
    async (playlistId: Selectable<DB['playlists']>['id'], includeInvalid = true) => {
      let tracks = await getPlaylistTracks(playlistId)

      if (!includeInvalid) tracks = tracks.filter((track) => !track.valid)

      const channels = await Promise.all(
        tracks.map(async (track) => {
          const { duration } = await getTrackData(track.path)

          const name = track.tags.TPE1
            ? `${getTrackTitle(track)} - ${track.tags.TPE1}`
            : getTrackTitle(track)
          const url = await $invoke(commands.getCanonicalPath, track.path)

          return {
            duration: Math.round(duration),
            name,
            url,
          }
        }),
      )

      const m3u = writeM3U({
        channels,
      })

      const playlistName = getPlaylistName(playlistId)
      const savedPath = await save({
        defaultPath: `${playlistName}.m3u`,
        filters: [
          {
            extensions: ['.m3u'],
            name: 'm3u playlist',
          },
        ],
        title: 'Export playlist as M3U',
      })
      if (!savedPath) return

      await writeFile(savedPath, new TextEncoder().encode(m3u))

      emitMessage({
        source: 'FileSystem',
        text: `Exported playlist "${playlistName}" to ${savedPath}`,
      })
    },
  )

  return {
    addToPlaylist,
    checkPlaylistExists,
    createPlaylist,
    deletePlaylist,
    exportPlaylistAsM3u,
    getPlaylistName,
    getPlaylistTracks,
    playlists,
    removeFromPlaylist,
    renamePlaylist,
  }
}
