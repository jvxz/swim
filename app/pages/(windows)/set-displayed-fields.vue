<script lang="ts" setup>
import { useFilter } from 'reka-ui'

const { getColumnFields, setColumnFields } = useTrackListColumns()
const columnFields = getColumnFields('objects')

const selectedField = shallowRef<TrackListColumn | null>(null)
const isDragging = shallowRef(false)

const availableListQuery = shallowRef('')
const { contains } = useFilter({ sensitivity: 'base' })

const activeListEl = useTemplateRef<HTMLDivElement>('activeListEl')
const {
  barStyles: activeListBarStyles,
  draggingItem: draggingActiveItem,
  getDragElementProps: activeDragElementProps,
} = useDraggable(columnFields, activeListEl, {
  _name: 'active',
  class: {
    dragging: 'opacity-50',
  },
  direction: 'vertical',
  doDragGhost: true,
  group: 'col-fields',
  onDragEnd: (params) => {
    columnFields.value = handleListRearrange(columnFields, params)
    isDragging.value = false
  },
  onDragStart: () => (isDragging.value = true),
})

const availableListEl = useTemplateRef<HTMLDivElement>('availableListEl')
const { getDragElementProps: availableDragElementProps } = useDraggable(
  toRef(objectValues(ALL_TRACK_LIST_COLUMNS)),
  availableListEl,
  {
    _name: 'available',
    direction: 'vertical',
    doDragGhost: true,
    group: 'col-fields',
    onDragEnd: (params) => {
      if (params.targetItem?._listId === params.prevItem._listId) return

      columnFields.value = columnFields.value.filter((f) => f.key !== params.prevItem.data.key)
      isDragging.value = false
    },
    onDragStart: () => (isDragging.value = true),
  },
)

function handleRemoveField(field: TrackListColumn | null) {
  if (!field) return

  setColumnFields(columnFields.value.filter((f) => f.key !== field.key).map((f) => f.key))
}

const { isOutside: isOutsideAvailableList } = useMouseInElement(availableListEl)
const showDeleteOverlay = computed(
  () => !!draggingActiveItem.value && !isOutsideAvailableList.value,
)
</script>

<template>
  <div class="p-2 flex gap-2 overflow-hidden">
    <UDraggableShell class="p-0 flex-1 size-full">
      <UInput
        v-model="availableListQuery"
        v-no-autocorrect
        leading-icon="tabler:search"
        placeholder="Search available fields..."
        class="shrink-0"
      />
      <UDraggableList
        ref="availableListEl"
        class="rounded-sm flex flex-col gap-1 size-full relative overflow-y-auto"
      >
        <div
          v-for="column in ALL_TRACK_LIST_COLUMNS"
          v-show="contains(`${column.label} ${column.key}`, availableListQuery)"
          :key="column.key"
          class="flex shrink-0 w-full active:text-foreground"
          :class="{
            'pointer-events-none': columnFields.some((f) => f.key === column.key),
            'opacity-50': showDeleteOverlay,
          }"
          v-bind="availableDragElementProps(column)"
        >
          <UDraggableItem
            :disabled="columnFields.some((f) => f.key === column.key)"
            :item="column"
            class="rounded-none flex-1"
            @pointerdown.right="selectedField = column"
            @click="
              () => {
                if (!isDragging) columnFields = [...columnFields, column]
              }
            "
          >
            <span class="truncate">{{ column.label }}</span>
          </UDraggableItem>
        </div>
        <div
          v-if="showDeleteOverlay"
          class="grid size-full pointer-events-none inset-0 place-items-center absolute"
        >
          <p class="text-lg font-medium">Drop to delete</p>
        </div>
      </UDraggableList>
    </UDraggableShell>
    <USeparator orientation="vertical" />
    <UContextMenu>
      <UContextMenuTrigger as-child>
        <UDraggableShell class="p-0 flex-1 w-full">
          <div
            ref="activeListEl"
            class="rounded-sm flex flex-col gap-1 size-full overflow-y-auto"
          >
            <div
              :style="activeListBarStyles"
              class="bg-muted-foreground h-px absolute z-120"
            />
            <div
              v-for="item in columnFields"
              :key="item.key"
              class="flex w-full active:text-foreground"
              v-bind="activeDragElementProps(item)"
            >
              <UDraggableItem
                :item="item"
                variant="ghost"
                class="flex-1"
                @pointerdown.right="selectedField = item"
              >
                <span class="truncate">{{ item.label }}</span>
              </UDraggableItem>
              <UButton
                size="icon"
                variant="ghost"
                class="rounded-none shrink-0 duration-0 transition-none active:text-foreground"
                data-no-drag
                @click="handleRemoveField(item)"
              >
                <Icon
                  name="tabler:trash"
                  class="size-3.5!"
                />
              </UButton>
            </div>
          </div>
        </UDraggableShell>
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuItem @click="handleRemoveField(selectedField)"> Remove </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </div>
</template>
