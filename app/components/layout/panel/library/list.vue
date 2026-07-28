<script lang="ts" setup>
const { playlists } = useUserPlaylists()

type TreeItem = Prettify<
  | {
      title: string
      type: 'folder' | 'item'
      icon?: string
      children?: TreeItem[]
      onClick?: () => void
    }
  | (Selectable<DB['playlists']> & {
      title: string
      type: 'playlist'
      icon?: string
      children?: TreeItem[]
    })
  | (Selectable<DB['library_folders']> & {
      title: string
      type: 'libraryFolder'
      icon?: string
      children?: TreeItem[]
    })
>

const { createPlaylist, deletePlaylist, renamePlaylist } = useUserPlaylists()
const { getLibraryFolders } = useLibrary()
const { data: folders } = getLibraryFolders()

function handleRenameSubmit(playlistId: number, name: string | null | undefined) {
  if (!name) return

  renamePlaylist(playlistId, name)
}

const expandedItems = shallowRef<string[]>([])
let shouldOpen = false
let listItemIdToOpen = ''

const debouncedOpen = useDebounceFn(() => {
  if (shouldOpen && listItemIdToOpen)
    expandedItems.value = [listItemIdToOpen, ...expandedItems.value]
}, 500)

function handleDragOver(listItemId: string) {
  shouldOpen = true
  listItemIdToOpen = listItemId
  debouncedOpen()
}

const route = useRoute()
const isLibrarySelected = computed(() => route.name === 'library')

const treeItems = computed<TreeItem[]>(() => [
  {
    icon: 'tabler:folder',
    onClick: () => navigateTo('/library'),
    title: 'Library',
    type: 'item',
  },
  {
    children: playlists.value.map((playlist) => ({
      title: playlist.name,
      ...playlist,
      type: 'playlist',
    })),
    title: 'Playlists',
    type: 'folder',
  },
  {
    children: folders.value?.map((folder) => ({
      title: folder.path,
      ...folder,
      type: 'libraryFolder',
    })),
    title: 'Folders',
    type: 'folder',
  },
])
</script>

<template>
  <div class="flex flex-col gap-1">
    <UContextMenu>
      <UContextMenuTrigger as-child>
        <TreeRoot
          v-if="treeItems"
          v-slot="{ flattenItems }"
          v-model:expanded="expandedItems"
          :items="treeItems"
          :get-key="(p) => p.title"
          class="space-y-0.75"
          selection-behavior="replace"
        >
          <TreeItem
            v-for="item in flattenItems"
            v-slot="{ isExpanded, isSelected }"
            :key="item._id"
            v-bind="item.bind"
            as-child
          >
            <template v-if="item.value.type === 'playlist'">
              <div :style="{ paddingLeft: `${item.level * 0.5}rem` }">
                <LayoutPanelLibraryListPlaylistItem
                  :key="item.value.id"
                  :is-selected="isSelected"
                  :playlist="item.value"
                  @submit-rename="handleRenameSubmit(item.value.id, $event)"
                  @delete-playlist="deletePlaylist(item.value.id)"
                />
              </div>
            </template>
            <template v-if="item.value.type === 'libraryFolder'">
              <div :style="{ paddingLeft: `${item.level * 0.5}rem` }">
                <LayoutPanelLibraryListFolderItem
                  :key="item.value.path"
                  :is-selected="isSelected"
                  :folder="item.value"
                  :style="{ paddingLeft: `${item.level * 0.5}rem` }"
                />
              </div>
            </template>
            <template v-else-if="item.value.type === 'folder'">
              <TauriDragoverProvider
                class="group block"
                :acceptable-keys="['track-list-entry', 'UNKNOWN']"
                @over="handleDragOver(item._id)"
                @leave="() => (shouldOpen = false)"
              >
                <UButton
                  variant="togglable"
                  class="text-foreground w-full justify-start"
                >
                  <Icon
                    :name="item.value.icon || 'tabler:chevron-right'"
                    class="size-4"
                    :class="{
                      'rotate-90': isExpanded,
                    }"
                  />
                  {{ item.value.title }}
                </UButton>
              </TauriDragoverProvider>
            </template>
            <template v-else-if="item.value.type === 'item'">
              <UButton
                :variant="
                  item.value.title === 'Library'
                    ? isLibrarySelected
                      ? 'toggled'
                      : 'togglable'
                    : isSelected
                      ? 'toggled'
                      : 'togglable'
                "
                class="text-foreground w-full justify-start"
                @click="item.value.onClick?.()"
              >
                <Icon
                  v-if="item.value.icon"
                  :name="item.value.icon"
                  class="size-4"
                />
                {{ item.value.title }}
              </UButton>
            </template>
          </TreeItem>
        </TreeRoot>
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuItem @click="createPlaylist({ name: 'New playlist' })">
          New playlist
        </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </div>
</template>
