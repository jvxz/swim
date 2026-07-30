<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  playlist: Selectable<DB['playlists']>
  isSelected: boolean
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  submitRename: [name: string | null | undefined]
  deletePlaylist: []
  addTracksToPlaylist: [itemPaths: string[]]
}>()

const { addToPlaylist } = useUserPlaylists()
const { openEditDialog } = useSmartPlaylistEditor()
const { getTracksData } = useTrackData()

async function handleDrop(itemPaths: string[]) {
  if (props.playlist.is_smart) return

  const tracks = await getTracksData(itemPaths)
  const validTracks = tracks.filter((track) => track.valid)

  if (validTracks.length > 0) await addToPlaylist(props.playlist.id, validTracks)
}

const route = useRoute()
const urlPlaylistId = computed(() => ('id' in route.params ? Number(route.params.id) : null))
</script>

<template>
  <EditableRoot
    v-slot="{ submit, edit, isEditing }"
    :default-value="playlist.name"
    activation-mode="dblclick"
    tabindex="-1"
    @submit="(name) => emits('submitRename', name)"
  >
    <UContextMenu>
      <UContextMenuTrigger
        as-child
        :disabled="isEditing"
      >
        <TauriDragoverProvider
          :acceptable-keys="['track-list-entry', 'UNKNOWN']"
          @drop="handleDrop"
        >
          <UButton
            :variant="isSelected ? 'toggled' : 'togglable'"
            class="group text-foreground w-full justify-start"
            :class="
              cn(
                isEditing ? 'bg-transparent!' : '',
                urlPlaylistId === playlist.id && 'ghost-button-active',
                props.class,
              )
            "
            v-bind="$attrs"
            @click="
              !isEditing &&
              navigateTo({
                name: 'playlist-id',
                params: {
                  id: playlist.id,
                },
              })
            "
          >
            <EditableArea class="flex gap-1.5 items-center">
              <Icon
                v-if="playlist.is_smart"
                name="tabler:settings-automation"
                class="opacity-70 shrink-0 size-3.5!"
              />
              <EditablePreview as-child>
                <span>{{ playlist.name }}</span>
              </EditablePreview>
              <EditableInput
                class="outline-none bg-card w-full"
                @blur="submit"
                @keydown.enter="submit"
              />
            </EditableArea>
          </UButton>
        </TauriDragoverProvider>
      </UContextMenuTrigger>
      <UContextMenuContent class="w-52">
        <UContextMenuItem @click="edit"> Rename </UContextMenuItem>
        <UContextMenuItem
          v-if="playlist.is_smart"
          @click="openEditDialog(playlist.id)"
        >
          Edit rules
        </UContextMenuItem>
        <UContextMenuItem @click="emits('deletePlaylist')"> Delete </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </EditableRoot>
</template>
