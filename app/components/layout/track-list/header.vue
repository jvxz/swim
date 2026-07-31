<script lang="ts" setup>
const props = defineProps<{
  path: TrackListInput['path']
  type: TrackListEntryType
  trackCount: number
  isLoading: boolean
}>()

const { deletePlaylist, exportPlaylistAsM3u, getPlaylistName } = useUserPlaylists()
const { addFolderToLibrary, removeFolderFromLibrary, useFolderInLibrary } = useLibrary()
const query = useTrackListSearchQuery()
const trackListInput = useTrackListInput()

const isLoading = toRef(props, 'isLoading')

let hasLoadedOnce = false
watch(
  isLoading,
  (v) => {
    if (!v) hasLoadedOnce = true
  },
  { immediate: true },
)

const showSpinner = shallowRef(false)
const { start, stop } = useTimeoutFn(
  () => {
    if (isLoading.value) showSpinner.value = true
  },
  500,
  { immediate: false },
)

watch(
  isLoading,
  (v) => {
    if (v) {
      if (!hasLoadedOnce) showSpinner.value = true
      else {
        showSpinner.value = false
        start()
      }
    } else {
      stop()
      showSpinner.value = false
    }
  },
  { immediate: true },
)

const { data: isFolderInLibrary, execute: checkFolderInLibrary } = useFolderInLibrary(
  props.path ?? '',
)
onMounted(() => {
  if (props.type === 'folder') checkFolderInLibrary()
})

const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
onKeyStrokeSafe(
  'meta_f',
  () => {
    const el = unrefElement(searchInput)
    if (el) {
      el.focus()
      el.select()
    }
  },
  {
    ignore: ['[data-slot="command-input"]'],
  },
)

const title = computed(() => {
  if (props.type === 'library') return 'Library'

  if (props.type === 'folder') return props.path

  return getPlaylistName(Number(props.path))
})

function setIncludeSubfolders(checked: boolean) {
  trackListInput.value = { ...trackListInput.value, deep: checked }
}
</script>

<template>
  <div class="px-4 border-b bg-background flex shrink-0 h-16 items-center justify-between">
    <div class="flex flex-col justify-center">
      <div class="flex gap-2 items-center">
        <p
          :title
          class="font-medium max-w-md truncate"
        >
          {{ title }}
        </p>
        <Icon
          v-if="isFolderInLibrary"
          name="tabler:folder-check"
        />
      </div>
      <USpinner
        v-if="showSpinner"
        class="h-[20px]"
      />
      <p
        v-else
        class="text-sm text-muted-foreground"
      >
        {{ trackCount }} {{ checkPlural(trackCount, 'tracks', 'track') }}
      </p>
    </div>
    <div class="flex gap-2 items-center">
      <UInput
        id="track-list-search-input"
        ref="searchInput"
        v-model="query"
        v-esc-blur
        v-no-autocorrect
        placeholder="Search"
      />
      <UDropdownMenuRoot>
        <UDropdownMenuTrigger as-child>
          <UButton
            variant="soft"
            size="icon"
          >
            <Icon name="tabler:dots-vertical" />
          </UButton>
        </UDropdownMenuTrigger>
        <UDropdownMenuContent align="end">
          <template v-if="type === 'folder'">
            <UDropdownMenuCheckboxItem
              :model-value="!!trackListInput.deep"
              @update:model-value="setIncludeSubfolders"
            >
              Include subfolders
            </UDropdownMenuCheckboxItem>
            <UDropdownMenuItem
              v-if="!isFolderInLibrary"
              @click="addFolderToLibrary(0, path)"
            >
              Add to library
            </UDropdownMenuItem>
            <UDropdownMenuItem
              v-else
              @click="removeFolderFromLibrary(0, path)"
            >
              Remove from library
            </UDropdownMenuItem>
          </template>
          <template v-else-if="type === 'playlist'">
            <UDropdownMenuItem @click="deletePlaylist(Number(path))">
              Delete playlist
            </UDropdownMenuItem>
            <UDropdownMenuItem @click="exportPlaylistAsM3u(Number(path))">
              Export playlist as M3U
            </UDropdownMenuItem>
          </template>
          <template v-else-if="type === 'library'">
            <UDropdownMenuItem> Add folder to library... </UDropdownMenuItem>
          </template>
        </UDropdownMenuContent>
      </UDropdownMenuRoot>
    </div>
  </div>
</template>
