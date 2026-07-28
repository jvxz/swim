<script lang="ts" setup>
const { createPlaylist } = useUserPlaylists()
</script>

<template>
  <LayoutPanelLayout>
    <UContextMenu>
      <UContextMenuTrigger as-child>
        <LayoutPanelLibraryList />
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuItem
          @click="
            createPlaylist({
              name: 'New playlist',
            })
          "
        >
          <Icon
            name="tabler:playlist-add"
            class="size-4"
          />
          New playlist
        </UContextMenuItem>
        <UContextMenuItem>
          <Icon
            name="tabler:folder-plus"
            class="size-4"
          />
          New folder
        </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </LayoutPanelLayout>
</template>
