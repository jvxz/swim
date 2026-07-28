const GREATER = 1
const LESSER = -1

export const sortTrackList = createUnrefFn((trackList: TrackListEntry[], input: TrackListInput) => {
  const settings = useSettings()
  const isPlaylist = isTrackListPlaylist(trackList)

  const sortedTrackList = trackList.toSorted((a, b) => {
    if (!a.valid || !b.valid) return LESSER

    if (!input.sortBy && isPlaylist)
      return (a as PlaylistEntry).position - (b as PlaylistEntry).position

    let aValue: string | undefined
    let bValue: string | undefined

    if (input.sortBy === 'TIT2') {
      aValue = getTrackTitle(a)
      bValue = getTrackTitle(b)
    } else if (input.sortBy === 'TYER') {
      aValue = getTrackYear(a, settings.layout.element.trackList.deriveYearFromTDRC)
      bValue = getTrackYear(b, settings.layout.element.trackList.deriveYearFromTDRC)
    } else if (input.sortBy === 'DURATION') {
      aValue = a.duration.toString()
      bValue = b.duration.toString()
    }
    // stored as 'YYYY-MM-DD HH:MM:SS', so lexicographic order is chronological
    else if (input.sortBy === 'DATE_ADDED') {
      aValue = a.date_added ?? undefined
      bValue = b.date_added ?? undefined
    } else if (input.sortBy === 'LAST_PLAYED') {
      aValue = a.last_played ?? undefined
      bValue = b.last_played ?? undefined
    } else if (input.sortBy === 'PLAY_COUNT') {
      aValue = a.play_count.toString()
      bValue = b.play_count.toString()
    } else {
      aValue = a.tags[input.sortBy ?? 'TIT2']
      bValue = b.tags[input.sortBy ?? 'TIT2']
    }

    if (!Number.isNaN(Number(aValue)) && !Number.isNaN(Number(bValue)))
      return Number(aValue) - Number(bValue)

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return GREATER
    if (bValue === undefined) return LESSER

    return aValue.localeCompare(bValue)
  })

  return input.sortOrder === 'Asc' ? sortedTrackList : sortedTrackList.reverse()
})
