export function getTrackTitle(track: TrackListEntry | FileEntry) {
  if (track.tags.TIT2) return track.tags.TIT2

  return track.name
}
