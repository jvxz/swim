import PQueue from 'p-queue'

const queue = new PQueue({
  concurrency: 1,
  interval: 1000,
  intervalCap: 2,
  timeout: 10000,
})

export const usePlayCount = createSharedComposable(() => {
  const { lastFmProfile, lastFmProfilePending } = storeToRefs(useLastFm())
  const { refreshTrackData } = useTrackData()
  const { emitMessage } = useConsole()

  const currentlyUpdatingPlayCount = ref<Set<string>>(new Set())

  const updatePlayCount = (tracks: TrackListEntry[], force: boolean = false) => {
    const tasks = tracks.map((track) => async () => {
      await until(lastFmProfilePending).toBe(false)

      if (!lastFmProfile.value || !canProcessTrack(track) || track.duration <= 30) return null

      const key = getTrackKey(track)
      if (!key) return null

      try {
        currentlyUpdatingPlayCount.value.add(key)

        const playCountRes = await $invoke(
          commands.getLastfmPlayCount,
          track.tags.TIT2,
          track.tags.TPE1,
          lastFmProfile.value.name,
        )
        if (!playCountRes) {
          currentlyUpdatingPlayCount.value.delete(key)
          return null
        }

        const playCount = Number(playCountRes.track.playcount)

        const exists = await $db()
          .selectFrom('track_play_count')
          .where('id_hash', '=', key)
          .selectAll()
          .executeTakeFirst()

        if (exists) {
          if (
            !force &&
            exists.last_updated &&
            Date.now() - new Date(exists.last_updated).getTime() < 60 * 60 * 1000
          ) {
            emitMessage({
              source: 'LastFm',
              text: `Play count for track "${getTrackTitle(track)}" has been updated within the last hour, skipping update`,
              type: 'log',
            })

            currentlyUpdatingPlayCount.value.delete(key)

            return null
          }

          await $db()
            .updateTable('track_play_count')
            .set({
              play_count: playCount,
            })
            .where('id_hash', '=', key)
            .execute()
        } else {
          await $db()
            .insertInto('track_play_count')
            .values({
              id_hash: key,
              last_updated_from: 'lastfm',
              play_count: playCount,
            })
            .execute()
        }

        await refreshTrackData(track.path)

        emitMessage({
          source: 'LastFm',
          text: `Updated play count for track "${getTrackTitle(track)}" to ${playCount}`,
          type: 'log',
        })

        return playCount
      } finally {
        currentlyUpdatingPlayCount.value.delete(key)
      }
    })

    void queue.addAll(tasks)
  }

  async function incrementPlayCount(track: TrackListEntry) {
    if (!track.tags.TPE1 || !track.tags.TIT2) return

    const key = getTrackKey(track)
    if (!key) return

    const exists = await $db()
      .selectFrom('track_play_count')
      .where('id_hash', '=', key)
      .selectAll()
      .executeTakeFirst()

    if (!exists) {
      await $db()
        .insertInto('track_play_count')
        .values({
          id_hash: key,
          last_updated_from: 'local',
          play_count: 1,
        })
        .execute()
    } else {
      await $db()
        .updateTable('track_play_count')
        .set({
          play_count: exists.play_count + 1,
        })
        .where('id_hash', '=', key)
        .execute()
    }

    await refreshTrackData(track.path)
  }

  function canProcessTrack(
    track: TrackListEntry,
  ): track is TrackListEntry & { tags: { TPE1: string; TIT2: string } } {
    return !!(lastFmProfile && track.valid && track.tags.TPE1 && track.tags.TIT2)
  }

  function isUpdatingPlayCount(track: TrackListEntry): boolean {
    const key = getTrackKey(track)
    if (!key) return false

    return currentlyUpdatingPlayCount.value.has(key)
  }

  function getTrackKey(track: TrackListEntry): string | null {
    if (!track.tags.TPE1 || !track.tags.TIT2) return null

    const t = track.tags.TIT2.trim().toLowerCase()
    const a = track.tags.TPE1.trim().toLowerCase()

    return `${t.length}:${t}${a.length}:${a}`
  }

  return {
    currentlyUpdatingPlayCount,
    incrementPlayCount,
    isUpdatingPlayCount,
    updatePlayCount,
  }
})
