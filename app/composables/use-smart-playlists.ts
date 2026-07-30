export function useSmartPlaylists() {
  const { getTracksData } = useTrackData()
  const { emitMessage } = useConsole()

  async function createSmartPlaylist(opts: { name: string; rules: SmartPlaylistGroup }) {
    const playlist = await $db()
      .insertInto('playlists')
      .values({
        is_smart: 1,
        name: opts.name,
        rules: JSON.stringify(opts.rules),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    refreshNuxtData('playlists')

    emitMessage({
      source: 'Sql',
      text: `Smart playlist "${opts.name}" created`,
      type: 'log',
    })

    return playlist
  }

  async function updateSmartPlaylistRules(playlistId: number, rules: SmartPlaylistGroup) {
    await $db()
      .updateTable('playlists')
      .set({ rules: JSON.stringify(rules) })
      .where('id', '=', playlistId)
      .execute()

    refreshNuxtData('playlists')
    refreshTrackListForType('playlist', String(playlistId))
  }

  function parseSmartPlaylistRules(rules: string | null): SmartPlaylistGroup {
    if (!rules) return createEmptySmartPlaylistGroup()

    try {
      return JSON.parse(rules) as SmartPlaylistGroup
    } catch {
      return createEmptySmartPlaylistGroup()
    }
  }

  async function getSmartPlaylistTracks(
    playlist: Pick<Selectable<DB['playlists']>, 'rules'>,
  ): Promise<FileEntry[]> {
    const rules = parseSmartPlaylistRules(playlist.rules)

    // an unconfigured smart playlist matches nothing, not the whole library
    if (rules.items.length === 0) return []

    await backfillTrackMetadata()

    const rows = await $db()
      .selectFrom('library_tracks')
      .select('path')
      .where((eb) => compileSmartPlaylistGroup(eb, rules))
      .execute()

    return await getTracksData(rows.map((row) => row.path))
  }

  return {
    createSmartPlaylist,
    getSmartPlaylistTracks,
    parseSmartPlaylistRules,
    updateSmartPlaylistRules,
  }
}
