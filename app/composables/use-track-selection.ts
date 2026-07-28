interface SelectedTrackData {
  selectedFrom: TrackListInput
  entries: TrackListEntry[]
}

export const useTrackSelection = createSharedComposable(() => {
  const trackListInput = useTrackListInput()
  const trackData = useTrackData()
  const selectedTrackDataEntries = ref<TrackListEntry[]>([])
  const selectedTrackData = computed({
    get: () => {
      const entries: TrackListEntry[] = selectedTrackDataEntries.value.map((entry) =>
        trackData.toTrackListEntry(entry),
      )
      return {
        entries,
        selectedFrom: trackListInput.value,
      }
    },
    set: (value: SelectedTrackData) => {
      selectedTrackDataEntries.value = value.entries
    },
  })

  function editTrackSelection(shouldSelect: 'select' | 'deselect', entry: TrackListEntry) {
    const entryToEdit = entry

    if (shouldSelect === 'select') {
      if (checkIsSelected(entry)) return

      selectedTrackDataEntries.value = [...selectedTrackDataEntries.value, entryToEdit]
    } else {
      selectedTrackDataEntries.value = selectedTrackDataEntries.value.filter((entry) => {
        if (entry.is_playlist_track && entryToEdit.is_playlist_track)
          return entry.position !== entryToEdit.position
        else return entry.path !== entryToEdit.path
      })
    }
  }

  function checkIsSelected(entryToCheck: TrackListEntry) {
    const idx = selectedTrackData.value.entries.findIndex((entry) => {
      if (entry.is_playlist_track && entryToCheck.is_playlist_track)
        return entry.position === entryToCheck.position
      else return entry.path === entryToCheck.path
    })

    return idx >= 0
  }

  function clearSelectedTracks() {
    if (selectedTrackData.value.entries.length) selectedTrackDataEntries.value = []
  }

  const router = useRouter()
  router.beforeEach(() => {
    clearSelectedTracks()
  })

  return {
    checkIsSelected,
    clearSelectedTracks,
    editTrackSelection,
    selectedTrackData,
    selectedTrackDataEntries,
  }
})
