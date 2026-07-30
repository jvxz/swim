// mirrors `DownloadProgressEvent` in src-tauri/src/file_provider.rs — the
// event isn't part of `collect_commands!`, so specta doesn't generate it
export interface DownloadProgress {
  path: string
  status: DownloadStatus
  /** `null` when the provider doesn't report one — render indeterminate. */
  percent: number | null
}

export const useFileProvider = createSharedComposable(() => {
  const { listen } = useTauri()
  const { refreshTrackData } = useTrackData()

  // kept out of `trackCache` deliberately: this ticks several times a second
  // per download and must not drag a whole `FileEntry` refetch along with it
  const progress = shallowReactive<Map<string, DownloadProgress>>(new Map())

  listen<DownloadProgress>('file-provider-download-progress', ({ payload }) => {
    progress.set(payload.path, payload)
  })

  // `entry.download_status` is a snapshot from the last `FileEntry` fetch, so
  // it stays stale for the whole download. The progress map is authoritative
  // while a download is in flight.
  //
  // The field is absent on tracks restored from the persisted store, which were
  // written before it existed — those are ordinary local files, so an unknown
  // status has to read as `Local` or every one of them looks cloud-only.
  function liveDownloadStatus(entry: { download_status?: DownloadStatus; path: string }) {
    return progress.get(entry.path)?.status ?? entry.download_status ?? 'Local'
  }

  async function downloadTracks(paths: string[]) {
    if (!paths.length) return

    try {
      await $invoke(commands.downloadTracks, paths)
    } finally {
      // the backend drops these paths from its own cache on every terminal
      // state, so this picks up real tags for whatever succeeded
      await refreshTrackData(paths)
      paths.forEach((path) => progress.delete(path))
    }
  }

  return { downloadTracks, liveDownloadStatus, progress }
})
