export const getInputTypeFromEntry = createUnrefFn(
  (
    entry: Prettify<
      Omit<FileEntry, 'is_playlist_track'> & {
        is_playlist_track: boolean
      }
    >,
  ) => {
    if (entry.is_playlist_track) return 'playlist'

    return 'folder'
  },
)
