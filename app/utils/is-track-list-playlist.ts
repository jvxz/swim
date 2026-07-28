export const isTrackListPlaylist = createUnrefFn(
  (trackList: TrackListEntry[]): trackList is PlaylistEntry[] =>
    trackList.every((track) => track.is_playlist_track),
)
