export function getTrackMetadataFields(tags: FileEntry['tags']) {
  return {
    album_artist: tags.TPE2 ?? null,
    composer: tags.TCOM ?? null,
    disc_no: parseLeadingInt(tags.TPOS),
    genre: tags.TCON ?? null,
    track_no: parseLeadingInt(tags.TRCK),
    year: parseLeadingInt(tags.TYER ?? tags.TDRC),
  }
}

function parseLeadingInt(value: string | undefined): number | null {
  if (!value) return null

  const n = Number.parseInt(value, 10)

  return Number.isNaN(n) ? null : n
}
