export interface DuplicateGroup {
  key: string
  tracks: FileEntry[]
}

const norm = (value?: string | null) => (value ?? '').trim().toLowerCase()

const titleOf = (track: FileEntry) => norm(track.tags.TIT2) || norm(track.name)

// null byte can't appear in a tag value, so it's a safe field separator
const SEP = '\0'

/** Match on artist + title + album. Empty when the track carries no identifying tags. */
export function metadataKey(track: FileEntry) {
  const parts = [norm(track.tags.TPE1), titleOf(track), norm(track.tags.TALB)]
  return parts.some(Boolean) ? parts.join(SEP) : ''
}

/** Match on artist + title + duration (rounded to the second). */
export function durationKey(track: FileEntry) {
  return [norm(track.tags.TPE1), titleOf(track), Math.round(track.duration)].join(SEP)
}

/**
 * Group tracks sharing a non-empty key. Only groups with more than one track
 * (i.e. actual duplicates) are returned; input order is preserved within a group.
 */
export function groupDuplicates(
  tracks: FileEntry[],
  keyOf: (track: FileEntry) => string,
): DuplicateGroup[] {
  const groups = new Map<string, FileEntry[]>()

  for (const track of tracks) {
    const key = keyOf(track)
    if (!key) continue

    const existing = groups.get(key)
    if (existing) existing.push(track)
    else groups.set(key, [track])
  }

  return [...groups]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, tracks: group }))
}
