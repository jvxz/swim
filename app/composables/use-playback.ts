export const usePlayback = createSharedComposable(() => {
  const { listen, prefs, store } = useTauri()
  const { scrobbleTrack, updateNowPlaying } = useLastFm()
  const { getTrackData, refreshTrackData, trackCache } = useTrackData()
  const { emitMessage } = useConsole()
  const { incrementPlayCount, updatePlayCount } = usePlayCount()
  const { markTrackPlayed } = useLibrary()
  const { downloadTracks } = useFileProvider()

  // internal
  const _playbackStatus = ref<StreamStatus | null>(
    prefs.get('playback-status') as StreamStatus | null,
  )
  // public
  const playbackStatus = readonly(_playbackStatus)

  // the cached value above can be stale (e.g. it still names an output
  // device the backend fell back away from during its own startup, before
  // this listener could exist) — GetStatus round-trips through the same
  // channel the audio thread's startup logic runs on before servicing any
  // request, so the response is guaranteed authoritative
  $invoke(commands.controlPlayback, 'GetStatus').then((status) => {
    _playbackStatus.value = status
  })

  const _currentTrackContext = shallowRef<CurrentPlayingTrack | null>(
    prefs.get('current-track') as CurrentPlayingTrack | null,
  )

  // derived from playbackStatus (backend-authoritative) rather than tracked
  // separately, so a failed/fallback device switch never shows a selection
  // that was never actually applied
  const outputDevice = computed(() => _playbackStatus.value?.output_device ?? null)
  const outputDevices = ref<AudioDeviceInfo[]>([])

  async function refreshOutputDevices() {
    outputDevices.value = await $invoke(commands.listOutputDevices)
  }

  async function setOutputDevice(deviceName: string | null) {
    _playbackStatus.value = await $invoke(commands.controlPlayback, {
      SetOutputDevice: deviceName,
    })
  }

  listen('output-device-fallback', () => {
    if (_playbackStatus.value) _playbackStatus.value.output_device = null
    emitError({
      data: 'Selected output device disconnected, reverted to system default',
      type: 'Audio',
    })
  })
  const currentTrack = computed<CurrentPlayingTrack | null>(() => {
    if (!_currentTrackContext.value) return null

    const fileEntry = trackCache.get(_currentTrackContext.value.path)
    if (!fileEntry) return _currentTrackContext.value

    return { ...fileEntry, ..._currentTrackContext.value, tags: { ...fileEntry.tags } }
  })

  // the track we've committed to playing once its download lands. The player
  // shows it as current before any audio exists, so the transport controls act
  // on the track the user just asked for rather than the one still loaded.
  const _pendingTrack = shallowRef<TrackListEntry | null>(null)
  // set when the user pauses mid-download: the track stays on screen and the
  // download keeps running, it just won't start itself when the file lands
  const _pendingPaused = shallowRef(false)
  // no audio exists for the displayed track either way, so it has no timeline;
  // `isAwaitingDownload` narrows that to "and it will start on its own"
  const hasPendingDownload = computed(() => _pendingTrack.value !== null)
  const isAwaitingDownload = computed(() => _pendingTrack.value !== null && !_pendingPaused.value)

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

  const _isShuffled = ref((prefs.get('shuffle-enabled') as boolean | null) ?? false)
  const isShuffled = readonly(_isShuffled)
  // the pre-shuffle order of _playbackList, so turning shuffle off restores it
  let _unshuffledList: TrackListEntry[] = []

  // reshuffles what comes after `fromIndex`, leaving already-played tracks where they are
  function shuffleUpcoming(list: TrackListEntry[], fromIndex: number) {
    const shuffled = [...list]

    for (let i = shuffled.length - 1; i > fromIndex + 1; i--) {
      const j = fromIndex + 1 + Math.floor(Math.random() * (i - fromIndex))
      ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }

    return shuffled
  }

  function toggleShuffle() {
    _isShuffled.value = !_isShuffled.value

    if (_isShuffled.value) {
      _unshuffledList = _playbackList.value
      _playbackList.value = shuffleUpcoming(_playbackList.value, _currentIndex.value)
    } else {
      if (_unshuffledList.length) _playbackList.value = _unshuffledList
      _unshuffledList = []
    }
  }

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
        // `entry` is the caller's snapshot from before the download started, so
        // it still says the file is remote — the fresh fetch knows better
        download_status: res.download_status,
      }
    },
    200,
  )

  async function playPauseCurrentTrack(action?: 'Resume' | 'Pause') {
    if (!_currentTrackContext.value || !_playbackStatus.value) return

    // there's no stream to pause or resume while a download is outstanding
    if (_pendingTrack.value) {
      if (!_pendingPaused.value) {
        if (action !== 'Resume') _pendingPaused.value = true
        return
      }

      // picking it back up: the download has been running the whole time, so
      // this either resumes the wait or plays immediately if it already landed
      if (action !== 'Pause') return void playTrack(_pendingTrack.value)

      return
    }

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
    // this call supersedes any download we were previously waiting on, so that
    // in-flight `playTrack` bails instead of hijacking playback when it lands
    _pendingTrack.value = null
    _pendingPaused.value = false

    if (list) {
      _unshuffledList = _isShuffled.value ? list : []
      _playbackList.value = _isShuffled.value
        ? shuffleUpcoming(
            list,
            list.findIndex((item) => item.path === entry.path),
          )
        : list
    }

    // scrobble previous track if not already scrobbled
    if (_currentTrackContext.value && _playbackStatus.value && canScrobble()) {
      scrobbleTrack(_currentTrackContext.value, _playbackStatus.value.duration)
      await nextTick()
    }

    // a File Provider placeholder has no audio to stream yet — materialize it
    // first (same command the context-menu action uses, just awaited here)
    if (entry.download_status !== 'Local') {
      // stop whatever's playing before the wait starts — the player is about to
      // show the track being downloaded, and still hearing the previous one
      // would contradict that
      _playbackStatus.value = await $invoke(commands.controlPlayback, 'Reset')

      // adopt it as the current track up front: the player then shows what's
      // coming, and skip/shuffle operate on it rather than the previous track
      _currentTrackContext.value = {
        ...entry,
        playback_source: getInputTypeFromEntry(entry),
        playback_source_id: entry.path,
      }
      _pendingTrack.value = entry

      await downloadTracks([entry.path])

      // superseded while downloading — another track was picked
      if (_pendingTrack.value?.path !== entry.path) return
      // paused while downloading — stay on screen, wait for play to be pressed
      if (_pendingPaused.value) return

      _pendingTrack.value = null

      if (trackCache.get(entry.path)?.download_status !== 'Local') {
        return emitError({
          data: `${entry.name} could not be downloaded`,
          type: 'FileSystem',
        })
      }
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

    // while awaiting a download the reported position belongs to the previous
    // track, so "restart this one" would be meaningless — always step back
    if (!_pendingTrack.value && offset === -1 && (_playbackStatus.value?.position ?? 0) > 3) {
      await seekCurrentTrack(0)
      return
    }

    const entry = _playbackList.value[_currentIndex.value + offset]
    if (!entry) return

    await playTrack(entry)
  }

  async function resetPlayback() {
    _pendingTrack.value = null
    _pendingPaused.value = false

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
  watch(_isShuffled, () => store.set('shuffle-enabled', _isShuffled.value))

  return {
    currentTrack,
    hasNextTrack,
    hasPendingDownload,
    hasPreviousTrack,
    isAwaitingDownload,
    isShuffled,
    outputDevice,
    outputDevices,
    playbackStatus,
    playPauseCurrentTrack,
    playTrack,
    refreshOutputDevices,
    resetPlayback,
    seekCurrentTrack,
    setLoop,
    setOutputDevice,
    setVolume,
    skipTrack,
    toggleMute,
    toggleShuffle,
  }
})
