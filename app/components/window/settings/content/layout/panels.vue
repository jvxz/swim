<script lang="ts" setup>
const props = defineProps<{
  panel: LayoutPanel
}>()

const containerEl = shallowRef<HTMLDivElement | null>(null)
const { isOutside: isOutsideContainer } = useMouseInElement(containerEl)

const { elementDraggingData, isElementAllowedInPanel } = useLayout()

const containerHoverClass = computed(() => {
  if (!elementDraggingData.value) return ''

  if (
    !isElementAllowedInPanel(props.panel.key, elementDraggingData.value.element) &&
    elementDraggingData.value.from !== props.panel.key
  )
    return 'opacity-50'

  if (!isOutsideContainer.value) return 'bg-muted/40'

  return ''
})
</script>

<template>
  <div
    ref="containerEl"
    class="group p-2 rounded-sm flex gap-2 items-start overflow-hidden -m-2"
    :class="containerHoverClass"
  >
    <div class="flex shrink-0 flex-col gap-2">
      <div class="border rounded-sm flex w-24 aspect-video">
        <div :class="panel.class" />
      </div>
    </div>
    <div class="flex flex-col gap-2 w-2/5">
      <div class="flex gap-2 items-center">
        <ULabel>
          {{ panel.label }}
        </ULabel>
      </div>
      <div class="flex flex-col gap-1">
        <WindowSettingsContentLayoutPanelsElements :panel-key="panel.key" />
      </div>
    </div>
  </div>
</template>
