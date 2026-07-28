<script lang="ts" setup>
const { layoutPanels: playlistColumnPercents, openSetDisplayedFieldsWindow } = useTrackListColumns()
const trackListInput = useTrackListInput()

const { getColumnFields } = useTrackListColumns()
const columnFields = getColumnFields('objects')

function handleColumnLeftClick(col: TrackListColumn) {
  if (!col.canSort) return

  const sortOrder =
    col.key === trackListInput.value.sortBy
      ? trackListInput.value.sortOrder === 'Asc'
        ? 'Desc'
        : 'Asc'
      : 'Asc'

  trackListInput.value = {
    ...trackListInput.value,
    sortBy: col.key,
    sortOrder,
  }
}

const container = useTemplateRef<HTMLElement>('container')
const { barStyles, getDragElementProps } = useDraggable(columnFields, container, {
  direction: 'horizontal',
  doDragGhost: false,
  onDragEnd: (params) => {
    columnFields.value = handleListRearrange(columnFields, params)
  },
})
</script>

<template>
  <div class="top-0 sticky z-30">
    <UContextMenu>
      <UContextMenuTrigger as-child>
        <SplitterGroup
          :key="columnFields.map((field) => field.key).join()"
          ref="container"
          direction="horizontal"
          as-child
          @layout="playlistColumnPercents = $event"
        >
          <div class="group/row bg-background shrink-0 z-20 h-8!">
            <div
              :style="barStyles"
              class="bg-primary w-px absolute"
            />
            <template
              v-for="(col, index) in columnFields"
              :key="col.key"
            >
              <SplitterResizeHandle
                v-if="index !== 0"
                class="bg-muted h-8 w-px invisible group-hover/row:visible"
              />
              <SplitterPanel
                :default-size="playlistColumnPercents[index]"
                :min-size="col.minSize"
                :max-size="col.maxSize"
                as-child
              >
                <div
                  class="flex flex-1 h-8 items-center"
                  v-bind="getDragElementProps(col)"
                  @click="handleColumnLeftClick(col)"
                >
                  <p class="text-xs text-muted-foreground font-medium px-1.5 truncate">
                    {{ col.hideLabelInColumn ? '' : col.label }}
                  </p>
                  <Icon
                    v-if="col.canSort"
                    :name="
                      trackListInput.sortBy === col.key
                        ? trackListInput.sortOrder === 'Asc'
                          ? 'tabler:sort-ascending'
                          : 'tabler:sort-descending'
                        : ''
                    "
                    class="size-3!"
                  />
                </div>
              </SplitterPanel>
            </template>
          </div>
        </SplitterGroup>
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuSub>
          <UContextMenuSubTrigger> Sort by </UContextMenuSubTrigger>
          <UContextMenuSubContent class="max-h-64 overflow-x-hidden overflow-y-auto">
            <UContextMenuRadioGroup v-model:model-value="trackListInput.sortBy">
              <UContextMenuRadioItem
                v-for="key in objectKeys(ALL_TRACK_LIST_COLUMNS)"
                :key="key"
                :value="key"
              >
                {{ ALL_TRACK_LIST_COLUMNS[key].label }}
              </UContextMenuRadioItem>
            </UContextMenuRadioGroup>
          </UContextMenuSubContent>
        </UContextMenuSub>
        <UContextMenuItem @click="openSetDisplayedFieldsWindow">
          Set displayed fields...
        </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </div>
</template>
