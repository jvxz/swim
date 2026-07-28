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
const id = 'id' in route.params ? Number(route.params.id) : 0

const trackListInput = useTrackListInput()

onMounted(() => {
  trackListInput.value = {
    ...trackListInput.value,
    path: id.toString(),
    type: 'playlist',
  }
})
</script>

<template>
  <div
    v-if="id"
    class="flex-1"
  >
    <LayoutTrackList
      v-bind="trackListInput"
      type="playlist"
      :path="id.toString()"
    />
  </div>
</template>
