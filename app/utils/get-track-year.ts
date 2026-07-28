export const getTrackYear = createUnrefFn((entry: TrackListEntry, deriveYearFromTDRC = false) => {
  if (entry.tags.TYER) return entry.tags.TYER

  if (entry.tags.TDRC && deriveYearFromTDRC) {
    try {
      const date = parseISO(entry.tags.TDRC)

      if (Number.isNaN(date.getTime())) return undefined

      return date.getFullYear().toString()
    } catch {
      return undefined
    }
  }

  return undefined
})
