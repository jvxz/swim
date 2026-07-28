<script lang="ts" setup>
import { useDraggable } from 'vue-draggable-plus'

const { elementDraggingData } = useLayout()

const listEl = shallowRef<HTMLDivElement | null>(null)
const { isOutside: isOutsideList } = useMouseInElement(listEl)

const list = shallowRef([...layoutPanelElementKeys])
const initialList = list.value

useDraggable(listEl, list, {
  animation: 0,
  direction: 'vertical',
  fallbackOnBody: true,
  forceFallback: true,
  ghostClass: 'sortable-ghost-item',
  group: {
    name: 'layout-elements',
    pull: 'clone',
  },
  onEnd: () => {
    list.value = initialList
    elementDraggingData.value = null
  },
  onStart: (evt) => (elementDraggingData.value = { element: evt.data, from: 'AVAILABLE_ELEMENTS' }),
  selectedClass: 'bg-blue-500',
  sort: false,
})

useStyleTag(
  computed(() =>
    elementDraggingData.value && elementDraggingData.value.from !== 'AVAILABLE_ELEMENTS'
      ? `
  .sortable-ghost-item {
    display: none !important;
  }
`
      : '',
  ),
)
</script>

<template>
  <div class="p-2 flex flex-col gap-1 h-fit w-1/4 relative -m-1">
    <ULabel
      class="font-medium"
      :class="{
        'opacity-30': elementDraggingData && elementDraggingData.from !== 'AVAILABLE_ELEMENTS',
      }"
    >
      Available elements
    </ULabel>
    <div
      ref="listEl"
      class="py-1 rounded-sm flex shrink-0 flex-col gap-1 h-fit"
      :class="{
        'opacity-25': elementDraggingData && elementDraggingData.from !== 'AVAILABLE_ELEMENTS',
      }"
    >
      <UButton
        v-for="element in layoutPanelElements"
        :id="element.key"
        :key="element.key"
        variant="ghost"
        draggable="true"
        class="rounded-r-none duration-0 transition-none justify-start active:text-muted-foreground active:bg-inherit"
      >
        <Icon
          name="tabler:grip-vertical"
          class="size-3.5!"
        />
        <p>{{ element.label }}</p>
      </UButton>
    </div>
    <div
      v-if="elementDraggingData && elementDraggingData.from !== 'AVAILABLE_ELEMENTS'"
      class="font-medium rounded-sm flex size-full pointer-events-none items-center inset-0 justify-center absolute"
      :class="!isOutsideList && 'bg-muted/40'"
    >
      Drop to delete
    </div>
  </div>
</template>
