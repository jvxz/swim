<script lang="ts" setup>
import { useFilter } from 'reka-ui'

const settings = useSettings()

const selectedField = shallowRef<Id3FrameId | null>(null)
const isDragging = shallowRef(false)

const availableListQuery = shallowRef('')
const { contains } = useFilter({ sensitivity: 'base' })

const fields = computed(() => settings.layout.element.metadataView.frames)

const activeListEl = useTemplateRef<HTMLDivElement>('activeListEl')
const {
  barStyles: activeListBarStyles,
  draggingItem: draggingActiveItem,
  getDragElementProps: activeDragElementProps,
} = useDraggable(fields, activeListEl, {
  class: {
    dragging: 'opacity-50',
  },
  direction: 'vertical',
  doDragGhost: true,
  group: 'metadata-view-frames',
  onDragEnd: (params) => {
    settings.layout.element.metadataView.frames = handleListRearrange(
      settings.layout.element.metadataView.frames,
      params,
    )
    isDragging.value = false
  },
  onDragStart: () => (isDragging.value = true),
})

const availableListEl = useTemplateRef<HTMLDivElement>('availableListEl')
const { getDragElementProps: availableDragElementProps } = useDraggable(
  toRef(objectKeys(ID3_MAP)),
  availableListEl,
  {
    direction: 'vertical',
    doDragGhost: true,
    group: 'metadata-view-frames',
    onDragEnd: (params) => {
      if (params.targetItem?._listId === params.prevItem._listId) return

      settings.layout.element.metadataView.frames =
        settings.layout.element.metadataView.frames.filter((f) => f !== params.prevItem.data)
      isDragging.value = false
    },
    onDragStart: () => (isDragging.value = true),
  },
)

function handleRemoveField(field: Id3FrameId | null) {
  if (!field) return

  settings.layout.element.metadataView.frames = settings.layout.element.metadataView.frames.filter(
    (f) => f !== field,
  )
}

const { isOutside: isOutsideAvailableList } = useMouseInElement(availableListEl)
const showDeleteOverlay = computed(
  () => !!draggingActiveItem.value && !isOutsideAvailableList.value,
)
</script>

<template>
  <div class="flex gap-2 overflow-hidden">
    <UDraggableShell class="p-0 flex-1 size-full">
      <UInput
        v-model="availableListQuery"
        v-no-autocorrect
        leading-icon="tabler:search"
        placeholder="Search available frames..."
        class="shrink-0"
      />
      <UDraggableList
        ref="availableListEl"
        class="rounded-sm flex flex-col gap-1 size-full relative overflow-y-auto"
      >
        <div
          v-for="frame in objectKeys(ID3_MAP)"
          v-show="contains(`${frame} ${ID3_MAP[frame]}`, availableListQuery)"
          :key="frame"
          class="flex shrink-0 w-full active:text-foreground"
          :class="{
            'pointer-events-none': fields.some((f) => f === frame),
            'opacity-50': showDeleteOverlay,
          }"
          v-bind="availableDragElementProps(frame)"
        >
          <UDraggableItem
            :disabled="fields.some((f) => f === frame)"
            :item="frame"
            class="rounded-none flex-1"
            @pointerdown.right="selectedField = frame"
            @click="
              () => {
                if (!isDragging) settings.layout.element.metadataView.frames = [...fields, frame]
              }
            "
          >
            <span class="truncate">{{ ID3_MAP[frame] }}</span>
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
              v-for="item in fields"
              :key="item"
              class="flex w-full active:text-foreground"
              v-bind="activeDragElementProps(item)"
            >
              <UDraggableItem
                :item="item"
                variant="ghost"
                class="flex-1"
                @pointerdown.right="selectedField = item"
              >
                <span class="truncate">{{ ID3_MAP[item] }}</span>
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
