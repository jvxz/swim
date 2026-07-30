export const useSmartPlaylistEditor = createSharedComposable(() => {
  const isOpen = shallowRef(false)
  const editingPlaylistId = shallowRef<number | null>(null)

  function openCreateDialog() {
    editingPlaylistId.value = null
    isOpen.value = true
  }

  function openEditDialog(playlistId: number) {
    editingPlaylistId.value = playlistId
    isOpen.value = true
  }

  return { editingPlaylistId, isOpen, openCreateDialog, openEditDialog }
})
