export const usePlayback = createSharedComposable(() => {
  const { prefs, store } = useTauri()
  const { scrobbleTrack, updateNowPlaying } = useLastFm()
  const { getTrackData, refreshTrackData, trackCache } = useTrackData()
  const { emitMessage } = useConsole()
  const { incrementPlayCount, updatePlayCount } = usePlayCount()
  const { markTrackPlayed } = useLibrary()

  // internal
  const _playbackStatus = ref<StreamStatus | null>(
    prefs.get('playback-status') as StreamStatus | null,
  )
  // public
  const playbackStatus = readonly(_playbackStatus)

  const _currentTrackContext = shallowRef<CurrentPlayingTrack | null>(
    prefs.get('current-track') as CurrentPlayingTrack | null,
  )
  const currentTrack = computed<CurrentPlayingTrack | null>(() => {
    if (!_currentTrackContext.value) return null

    const fileEntry = trackCache.get(_currentTrackContext.value.path)
    if (!fileEntry) return _currentTrackContext.value

    return { ...fileEntry, ..._currentTrackContext.value, tags: { ...fileEntry.tags } }
  })

  // the track list the current track was played from — the source for next/previous
  const _playbackList = shallowRef<TrackListEntry[]>([])
  const _currentIndex = computed(() => {
    const current = _currentTrackContext.value
    if (!current) return -1

    return _playbackList.value.findIndex((entry) => entry.path === current.path)
  })
  const hasPreviousTrack = computed(() => _currentIndex.value > 0)
  const hasNextTrack = computed(
    () => _currentIndex.value >= 0 && _currentIndex.value < _playbackList.value.length - 1,
  )

  let timeListenedMs = 0
  let hasScrobbled = false
  const canScrobble = () => {
    if (!_playbackStatus.value?.position) return false

    const hasListenedForHalf =
      timeListenedMs / 1000 >= Math.floor(_playbackStatus.value.duration / 2)
    const hasListenedFor30s = timeListenedMs / 1000 >= 30
    const hasListenedFor4m = timeListenedMs / 1000 >= 4 * 60

    const hasListenedForEnough = (hasListenedForHalf && hasListenedFor30s) || hasListenedFor4m
    const isLongEnough = _playbackStatus.value.duration >= 30

    return hasListenedForEnough && isLongEnough && !hasScrobbled
  }

  let lastTimestamp = performance.now()
  const { pause: pauseDurationTimer, resume: resumeDurationTimer } = useRafFn(() => {
    if (!_playbackStatus.value || !_playbackStatus.value.is_playing) return

    const currentTimestamp = performance.now()
    const deltaTime = currentTimestamp - lastTimestamp
    lastTimestamp = currentTimestamp

    _playbackStatus.value.position = Math.max(0, _playbackStatus.value?.position + deltaTime / 1000)
    timeListenedMs += deltaTime
  })

  watch(
    () => _playbackStatus.value?.is_playing,
    (isPlaying) => {
      if (isPlaying) {
        lastTimestamp = performance.now()
        resumeDurationTimer()
      } else pauseDurationTimer()
    },
  )

  watch(
    () => _playbackStatus.value?.position,
    async () => {
      if (!_currentTrackContext.value || !_playbackStatus.value?.position) return

      if (_playbackStatus.value.position >= _playbackStatus.value.duration) {
        // track finished, reset position & scrobble if not already scrobbled
        if (canScrobble()) {
          scrobbleTrack(_currentTrackContext.value, _playbackStatus.value.duration)
          hasScrobbled = true
          // await to prevent race condition
          await nextTick()
        }
        // sequential so the two track-data refreshes can't race each other
        const playedPath = _currentTrackContext.value.path
        void incrementPlayCount(_currentTrackContext.value).then(() => markTrackPlayed(playedPath))
        _playbackStatus.value.position = 0

        // if not looping, stop playback & reset current track
        if (!_playbackStatus.value?.is_looping) {
          _playbackStatus.value.is_playing = false
          _playbackStatus.value.path = null

          _currentTrackContext.value = null
        } else {
          // if looping, reset hasScrobbled & refresh now playing
          hasScrobbled = false
          timeListenedMs = 0
          updateNowPlaying(_currentTrackContext.value, _playbackStatus.value.duration)
        }
      }
    },
  )

  const getTrackDataEntry = useThrottleFn(
    async (entry: TrackListEntry): Promise<TrackListEntry | null> => {
      const res = await getTrackData(entry.path)
      if (!res) return null

      return {
        ...res,
        ...entry,
      }
    },
    200,
  )

  async function playPauseCurrentTrack(action?: 'Resume' | 'Pause') {
    if (!_currentTrackContext.value || !_playbackStatus.value) return

    // scrobble current track if not already scrobbled & applicable
    if (_currentTrackContext.value && _playbackStatus.value && canScrobble()) {
      scrobbleTrack(_currentTrackContext.value, _playbackStatus.value.duration)
      hasScrobbled = true
      await nextTick()
    }

    if (!action) action = _playbackStatus.value?.is_playing ? 'Pause' : 'Resume'

    _playbackStatus.value = await $invoke(commands.controlPlayback, action)
  }

  async function playTrack(entry: TrackListEntry, list?: TrackListEntry[]) {
    if (list) _playbackList.value = list

    // scrobble previous track if not already scrobbled
    if (_currentTrackContext.value && _playbackStatus.value && canScrobble()) {
      scrobbleTrack(_currentTrackContext.value, _playbackStatus.value.duration)
      await nextTick()
    }

    try {
      const exists = await useTauriFsExists(entry.path)
      if (!exists) {
        refreshTrackData(entry.path)
        return emitError({
          data: `${entry.name} does not exist`,
          type: 'FileSystem',
        })
      }

      if (!entry.valid) refreshTrackData(entry.path)
    } catch {
      refreshTrackData(entry.path)
      return emitError({
        data: `${entry.name} is inaccessible (may have been moved, deleted, or permission denied)`,
        type: 'FileSystem',
      })
    }

    const status = await $invoke(commands.controlPlayback, {
      Play: entry.path,
    })
    _playbackStatus.value = status

    if (status.path === entry.path) {
      const data = await getTrackDataEntry(entry)
      if (!data) {
        refreshTrackData(entry.path)

        _currentTrackContext.value = null
        await $invoke(commands.controlPlayback, 'Reset')

        return emitError({
          data: `${entry.name} is inaccessible (may have been moved, deleted, or permission denied)`,
          type: 'FileSystem',
        })
      }

      _currentTrackContext.value = {
        ...data,
        playback_source: getInputTypeFromEntry(entry),
        playback_source_id: entry.path,
      }

      emitMessage({
        source: 'Audio',
        text: `Playing track "${getTrackTitle(_currentTrackContext.value)}"`,
        type: 'log',
      })

      await updateNowPlaying(_currentTrackContext.value, _playbackStatus.value.duration)
      updatePlayCount([_currentTrackContext.value])
    } else _currentTrackContext.value = null

    timeListenedMs = 0
    hasScrobbled = false
    resumeDurationTimer()
  }

  async function skipTrack(offset: 1 | -1) {
    if (_currentIndex.value === -1) return

    const entry = _playbackList.value[_currentIndex.value + offset]
    if (!entry) return

    await playTrack(entry)
  }

  async function resetPlayback() {
    const status = await $invoke(commands.controlPlayback, 'Reset')
    _playbackStatus.value = status
    _currentTrackContext.value = null
  }

  async function setLoop(loop: boolean) {
    await $invoke(commands.controlPlayback, {
      SetLoop: loop,
    })

    if (_playbackStatus.value) _playbackStatus.value.is_looping = loop
  }

  async function seekCurrentTrack(to: number) {
    if (!_playbackStatus.value) return

    const _status = await $invoke(commands.controlPlayback, {
      Seek: to,
    })
    _playbackStatus.value = _status
  }

  async function setVolume(volume: number) {
    if (_playbackStatus.value?.is_muted) toggleMute()

    await $invoke(commands.controlPlayback, {
      SetVolume: volume,
    })

    if (_playbackStatus.value) _playbackStatus.value.volume = volume
  }

  async function toggleMute() {
    await $invoke(commands.controlPlayback, 'ToggleMute')

    if (_playbackStatus.value) _playbackStatus.value.is_muted = !_playbackStatus.value.is_muted
  }

  watchDebounced(_playbackStatus, () => store.set('playback-status', _playbackStatus.value), {
    debounce: 500,
  })
  watchDebounced(currentTrack, () => store.set('current-track', currentTrack.value), {
    debounce: 500,
  })

  return {
    currentTrack,
    hasNextTrack,
    hasPreviousTrack,
    playbackStatus,
    playPauseCurrentTrack,
    playTrack,
    resetPlayback,
    seekCurrentTrack,
    setLoop,
    setVolume,
    skipTrack,
    toggleMute,
  }
})
