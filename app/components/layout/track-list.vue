<script lang="ts" setup>
import { OnClickOutside } from '@vueuse/components'

import type { TrackListInput } from '~/types'

const props = defineProps<
  TrackListInput & {
    forceVirtualize?: boolean
  }
>()

const keys = useGlobalKeys()
const { getTrackList } = useTrackList()
const { playbackStatus, playTrack } = usePlayback()
const { layoutPanels: playlistHeaderPercents } = useTrackListColumns()
const { isUpdatingPlayCount } = usePlayCount()
const {
  checkIsSelected,
  clearSelectedTracks,
  editTrackSelection,
  selectedTrackData,
  selectedTrackDataEntries,
} = useTrackSelection()
const settings = useSettings()

const { getColumnFields } = useTrackListColumns()
const columnFields = getColumnFields('objects')

const { data: folderEntries, isLoading: isLoadingPlaylistData } = getTrackList(toRef(props))

let allowRowDragStart = false
let isDraggingEntries = false
let entryToSelectInsteadOfDrag: TrackListEntry | null = null
let shouldSelectOrDeselect: 'select' | 'deselect' = 'select'
let wasMouseDownOnTrackRow = false

const shouldVirtualize = computed(
  () => folderEntries.value.length >= TRACK_LIST_VIRTUALIZATION_THRESHOLD,
)

const contextMenuEntries = shallowRef<TrackListEntry[] | null>(null)

useEventListener('mouseup', () => {
  wasMouseDownOnTrackRow = false
  allowRowDragStart = false

  if (!isDraggingEntries && entryToSelectInsteadOfDrag) {
    if (keys.ctrl?.value) editTrackSelection('deselect', entryToSelectInsteadOfDrag)
    else {
      clearSelectedTracks()
      editTrackSelection('select', entryToSelectInsteadOfDrag)
    }
    entryToSelectInsteadOfDrag = null
  }

  isDraggingEntries = false
  contextMenuEntries.value = selectedTrackData.value.entries
})

const { startDrag } = useDrag()

async function handleRowDragStart(e: DragEvent, wasEntrySelected: boolean) {
  e.preventDefault()

  if (!allowRowDragStart) return

  entryToSelectInsteadOfDrag = null

  if (wasEntrySelected) {
    isDraggingEntries = true
    await startDrag(
      {
        data: {
          entries: selectedTrackData.value.entries,
        },
        key: 'track-list-entry',
      },
      {
        item: selectedTrackData.value.entries.map((entry) => entry.path),
      },
    )
  }
}

async function handleSelectDragStart(entryTriggeredFrom: TrackListEntry) {
  if (wasMouseDownOnTrackRow) return

  const isEntryTriggeredFromSelected = checkIsSelected(entryTriggeredFrom)

  if (!isEntryTriggeredFromSelected) {
    if (keys.ctrl?.value) editTrackSelection('select', entryTriggeredFrom)
    else if (!keys.shift?.value) clearSelectedTracks()
  }

  if (isEntryTriggeredFromSelected) {
    allowRowDragStart = true
    entryToSelectInsteadOfDrag = entryTriggeredFrom
    return
  }

  if (
    keys.shift?.value &&
    !isEntryTriggeredFromSelected &&
    selectedTrackData.value.entries.length
  ) {
    const idx = folderEntries.value.findIndex((entry) => entry.path === entryTriggeredFrom.path)
    if (idx !== -1) {
      const lastSelectedEntryIndex = folderEntries.value.findIndex(
        (entry) => entry.path === selectedTrackData.value.entries.at(-1)!.path,
      )

      if (idx >= lastSelectedEntryIndex) {
        const newEntries = folderEntries.value.slice(lastSelectedEntryIndex, idx)
        selectedTrackDataEntries.value = [...selectedTrackData.value.entries, ...newEntries]
      } else {
        const newEntries = folderEntries.value.slice(
          idx,
          folderEntries.value.findIndex(
            (entry) => entry.path === selectedTrackData.value.entries[0]!.path,
          ),
        )
        selectedTrackDataEntries.value = [...newEntries, ...selectedTrackData.value.entries]
      }
    }
  }

  shouldSelectOrDeselect = keys.shift?.value && isEntryTriggeredFromSelected ? 'deselect' : 'select'
  wasMouseDownOnTrackRow = true

  editTrackSelection(shouldSelectOrDeselect, entryTriggeredFrom)
  allowRowDragStart = false
}

async function handleDragHoverSelect(entryToEdit: TrackListEntry) {
  if (!wasMouseDownOnTrackRow) return

  editTrackSelection(shouldSelectOrDeselect, entryToEdit)
}

function handleRightClick(entry: TrackListEntry) {
  const clickedOnSelectedTrack = checkIsSelected(entry)

  if (
    !clickedOnSelectedTrack ||
    !selectedTrackData.value.entries.length ||
    selectedTrackData.value.entries.length === 1
  )
    selectedTrackDataEntries.value = [entry]
}

const columnFieldsKey = computed(() => columnFields.value.map((field) => field.key).join())

onKeyStrokeSafe('ctrl_a', () => (selectedTrackDataEntries.value = folderEntries.value))
onKeyStrokeSafe('ctrl_d', () => (selectedTrackDataEntries.value = []))

const scrollY = shallowRef(0)

const nonVirtualContainer = useTemplateRef<HTMLDivElement>('nonVirtualContainer')
const { y: nonVirtualScrollY } = useScroll(nonVirtualContainer, { throttle: 500 })

syncRefs(nonVirtualScrollY, scrollY)

const { scrollStateMap } = useTrackListScrollState()
const { path: routePath } = useRoute()
onBeforeRouteLeave(() => {
  if (settings.layout.element.trackList.persistScroll) scrollStateMap.set(routePath, scrollY.value)
})

onMounted(() => {
  const savedScrollY = scrollStateMap.get(routePath)
  if (savedScrollY && settings.layout.element.trackList.persistScroll) {
    scrollY.value = savedScrollY
    nonVirtualScrollY.value = savedScrollY
  }
})
</script>

<template>
  <div
    :data-row-style="settings.layout.element.trackList.rowStyle"
    class="group flex flex-1 flex-col h-full cursor-default select-none"
  >
    <LayoutTrackListHeader
      :path
      :type
      :track-count="folderEntries.length"
      :is-loading="isLoadingPlaylistData"
    />

    <OnClickOutside
      @trigger="settings.general.clickOutsideToDeselect ? clearSelectedTracks() : null"
    >
      <LayoutTrackListVirtualProvider
        v-if="shouldVirtualize || forceVirtualize"
        v-slot="{ containerProps, list, wrapperProps }"
        v-model:scroll-y="scrollY"
        :entries="folderEntries"
      >
        <div
          class="h-full cursor-default select-none overflow-y-auto"
          v-bind="containerProps"
          :class="{
            'scrollbar-gutter-stable': settings.layout.element.trackList.showScrollbarGutter,
          }"
        >
          <LayoutTrackListColumns
            v-bind="props"
            class="h-8 top-0 sticky z-30"
          />
          <LayoutTrackListRowContextMenu :entries="contextMenuEntries">
            <div
              class="grid h-full"
              v-bind="wrapperProps"
              :style="{
                gridTemplateColumns: playlistHeaderPercents.map((p) => `${p}fr`).join(' '),
                gridAutoRows: `${TRACK_LIST_ITEM_HEIGHT}px`,
              }"
            >
              <LayoutTrackListRow
                v-for="entry in list"
                :key="entry.data.path"
                v-memo="[
                  columnFieldsKey,
                  entry.data.path,
                  checkIsSelected(entry.data),
                  playbackStatus?.path === entry.data.path,
                  entry.data.valid,
                  entry.data.tags,
                  entry.data.play_count,
                  entry.data.last_played,
                  entry.data.download_status,
                  isUpdatingPlayCount(entry.data),
                ]"
                draggable="true"
                :entry="entry.data"
                :columns="columnFields"
                :is-selected="checkIsSelected(entry.data)"
                :is-playing="playbackStatus?.path === entry.data.path"
                :is-even="entry.index % 2 === 0"
                :is-updating-play-count="isUpdatingPlayCount(entry.data)"
                @row-drag-start="handleRowDragStart($event, checkIsSelected(entry.data))"
                @mousedown.left="handleSelectDragStart(entry.data)"
                @mouseover="handleDragHoverSelect(entry.data)"
                @play-track="playTrack(entry.data, folderEntries)"
                @mousedown.right="handleRightClick(entry.data)"
              />
            </div>
          </LayoutTrackListRowContextMenu>
        </div>
      </LayoutTrackListVirtualProvider>
      <div
        v-else
        ref="nonVirtualContainer"
        class="h-full cursor-default select-none overflow-y-auto"
        :class="{
          'scrollbar-gutter-stable': settings.layout.element.trackList.showScrollbarGutter,
        }"
      >
        <LayoutTrackListColumns
          v-bind="props"
          class="h-8 top-0 sticky z-30"
        />
        <LayoutTrackListRowContextMenu :entries="contextMenuEntries">
          <div
            class="grid"
            :style="{
              columnGap: '1px',
              gridTemplateColumns: playlistHeaderPercents.map((p) => `${p}fr`).join(' '),
              gridAutoRows: `${TRACK_LIST_ITEM_HEIGHT}px`,
            }"
          >
            <LayoutTrackListRow
              v-for="(entry, index) in folderEntries"
              :key="entry.path"
              v-memo="[
                columnFieldsKey,
                entry.path,
                checkIsSelected(entry),
                playbackStatus?.path === entry.path,
                entry.valid,
                entry.tags,
                entry.play_count,
                entry.last_played,
                entry.download_status,
                isUpdatingPlayCount(entry),
              ]"
              draggable="true"
              :entry="entry"
              :columns="columnFields"
              :is-selected="checkIsSelected(entry)"
              :is-playing="playbackStatus?.path === entry.path"
              :is-even="index % 2 === 0"
              :is-updating-play-count="isUpdatingPlayCount(entry)"
              @row-drag-start="handleRowDragStart($event, checkIsSelected(entry))"
              @mousedown.left="handleSelectDragStart(entry)"
              @mouseover="handleDragHoverSelect(entry)"
              @play-track="playTrack(entry, folderEntries)"
              @mousedown.right="handleRightClick(entry)"
            />
          </div>
        </LayoutTrackListRowContextMenu>
      </div>
    </OnClickOutside>
  </div>
</template>

<style scoped>
*::-webkit-scrollbar {
  width: 15px;
  height: 15px;
}
</style>
