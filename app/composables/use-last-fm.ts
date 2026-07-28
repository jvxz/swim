import { LazyStore } from '@tauri-apps/plugin-store'

const offlineScrobbleCache = new LazyStore('lastfm-offline-scrobbles.json', {
  autoSave: true,
  defaults: {
    scrobbles: [],
  },
})

export const useLastFm = defineStore('lastfm', () => {
  const { emitMessage } = useConsole()
  const { isOnline } = useNetwork()
  const settings = useSettings()

  const {
    execute: fetchLastFmProfile,
    isLoading: lastFmProfilePending,
    state: lastFmProfile,
  } = useAsyncState(
    async () => {
      try {
        const status = await $invoke(commands.getLastfmAuthStatus)
        if (!status) return

        const profile = await $invoke(commands.getLastfmProfile)

        const res = LastFmUserGetInfoResponseSchema.safeParse(JSON.parse(profile))
        if (!res.success) return

        emitMessage({
          source: 'LastFm',
          text: `Logged in as "${res.data.user.name}"`,
          type: 'log',
        })

        return res.data.user
      } catch {
        return null
      }
    },
    undefined,
    { immediate: false },
  )

  watch(
    isOnline,
    async (isOnline) => {
      await until(lastFmProfilePending).toBe(false)

      await fetchLastFmProfile()

      const shouldProcessOfflineScrobbles = settings.lastFm.doScrobbling && lastFmProfile.value
      if (!shouldProcessOfflineScrobbles) return

      if (isOnline) {
        const scrobbles = (await offlineScrobbleCache.get('scrobbles')) as
          | SerializedOfflineScrobble[]
          | undefined
        if (scrobbles && scrobbles.length > 0) {
          try {
            await $invoke(commands.processOfflineScrobbles, scrobbles)
            emitMessage({
              source: 'LastFm',
              text: `Processed ${scrobbles.length} offline scrobbles`,
              type: 'log',
            })
          } catch {
            emitError({
              data: `Failed to process offline scrobbles. Your ${scrobbles.length} ${checkPlural(scrobbles.length, 'cached scrobbles')} can be manually processed in settings`,
              type: 'LastFm',
            })
            return
          }
          await offlineScrobbleCache.clear()
        }
      }
    },
    {
      immediate: true,
    },
  )

  const startAuth = () => $invoke(commands.openLastfmAuth)
  const completeAuth = async (token: string) => {
    const username = await $invoke(commands.completeLastfmAuth, token)
    if (username) {
      await fetchLastFmProfile()
      return username
    }
  }
  const removeAuth = async () => {
    await $invoke(commands.removeLastfmAccount)
    await fetchLastFmProfile()
  }

  const updateNowPlaying = useDebounceFn(async (track: TrackListEntry, duration: number) => {
    if (
      !lastFmProfile.value ||
      !settings.lastFm.doScrobbling ||
      !settings.lastFm.doNowPlayingUpdates ||
      !isOnline.value ||
      !track.valid
    )
      return

    const scrobble = getSerializedScrobble(track, duration)
    if (scrobble) {
      await $invoke(commands.setNowPlaying, scrobble)

      emitMessage({
        source: 'LastFm',
        text: `Updated now playing status for "${getTrackTitle(track)}"`,
        type: 'log',
      })
    }
  }, 2000)

  const scrobbleTrack = useDebounceFn(async (track: TrackListEntry, duration: number) => {
    if (!lastFmProfile.value || !settings.lastFm.doScrobbling || !track.valid) return

    const scrobble = getSerializedScrobble(track, duration)
    if (scrobble) {
      if (!isOnline.value) {
        return await addOfflineScrobble({
          scrobble,
          timestamp: Math.floor(Date.now() / 1000),
        })
      }

      try {
        await $invoke(commands.scrobbleTrack, scrobble)
        emitMessage({
          source: 'LastFm',
          text: `Scrobbled track "${getTrackTitle(track)}"`,
          type: 'log',
        })
      } catch {
        emitMessage({
          source: 'LastFm',
          text: `Failed to scrobble track "${getTrackTitle(track)}", adding to offline cache`,
          type: 'warn',
        })
        return await addOfflineScrobble({
          scrobble,
          timestamp: Math.floor(Date.now() / 1000),
        })
      }
    }
  }, 2000)

  const getLastFmPlayCount = (track: TrackListEntry) =>
    useAsyncState(
      async () => {
        if (!lastFmProfile.value || !track.valid || !track.tags.TPE1 || !track.tags.TIT2) return

        return $invoke(
          commands.getLastfmPlayCount,
          track.tags.TIT2,
          track.tags.TPE1,
          lastFmProfile.value.name,
        )
      },
      undefined,
      { immediate: false },
    )

  function getSerializedScrobble(track: TrackListEntry, duration: number) {
    if (!track.valid || !track.tags.TPE1 || !track.tags.TIT2) return null

    return {
      album: track.tags.TALB ?? null,
      album_artist: track.tags.TPE2 ?? null,
      artist: track.tags.TPE1,
      duration: Number(duration.toFixed(0)),
      track: track.tags.TIT2,
      track_number: track.tags.TRCK ? Number(track.tags.TRCK) : null,
    }
  }

  async function addOfflineScrobble(scrobble: SerializedOfflineScrobble) {
    const shouldCacheOfflineScrobbles = settings.lastFm.doOfflineScrobbling && lastFmProfile.value
    if (!shouldCacheOfflineScrobbles) return

    const offlineScrobbles = (await offlineScrobbleCache.get('scrobbles')) as
      | SerializedOfflineScrobble[]
      | undefined

    offlineScrobbleCache.set('scrobbles', [...(offlineScrobbles ?? []), scrobble])
  }

  return {
    completeAuth,
    fetchLastFmProfile,
    getLastFmPlayCount,
    lastFmProfile,
    lastFmProfilePending,
    removeAuth,
    scrobbleTrack,
    startAuth,
    updateNowPlaying,
  }
})

const IMAGE_SIZES = {
  1: 'small',
  2: 'medium',
  3: 'large',
  4: 'extralarge',
}

export function getLastFmImage(
  images: { '#text': string; size: string }[],
  maxSize: keyof typeof IMAGE_SIZES = 4,
): string | null {
  const result: { '#text': string; size: string }[] = []
  for (let size = maxSize; size >= 1; size--) {
    const label = IMAGE_SIZES[size]
    const found = images.find((img) => img.size === label && img['#text'])
    if (found) result.push(found)
  }
  return result[0]?.['#text'] ?? null
}

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useLastFm, import.meta.hot))
