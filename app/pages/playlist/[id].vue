<script lang="ts" setup>
definePageMeta({
  layout: 'main',
  middleware: async (to) => {
    const id = 'id' in to.params ? Number(to.params.id) : 0
    const playlistExists = await $db()
      .selectFrom('playlists')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst()

    if (id === 0 || !playlistExists) return abortNavigation()
  },
})

const route = useRoute()
const id = computed(() => ('id' in route.params ? Number(route.params.id) : 0))

const trackListInput = useTrackListInput()

onMounted(() => {
  trackListInput.value = {
    ...trackListInput.value,
    path: id.value.toString(),
    type: 'playlist',
  }
})

const { addToPlaylist } = useUserPlaylists()
const { getTracksData } = useTrackData()

async function handleDrop(itemPaths: string[]) {
  const tracks = await getTracksData(itemPaths)
  const validTracks = tracks.filter((track) => track.valid)

  if (validTracks.length > 0) await addToPlaylist(id.value, validTracks)
}
</script>

<template>
  <div
    v-if="id"
    class="flex-1"
  >
    <TauriDragoverProvider
      :acceptable-keys="['track-list-entry', 'UNKNOWN']"
      @drop="handleDrop"
    >
      <LayoutTrackList
        v-bind="trackListInput"
        type="playlist"
        :path="id.toString()"
      />
    </TauriDragoverProvider>
  </div>
</template>
