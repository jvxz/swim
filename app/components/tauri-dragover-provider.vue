<script lang="ts" setup>
import { Slot as RekaSlot } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<{
  acceptableKeys?: DragMetaEntryKey | DragMetaEntryKey[]
  class?: string
}>()

const emits = defineEmits<{
  drop: [itemPaths: string[], meta: DragMetaEntry]
  over: []
  leave: []
}>()

const { $dragHandler } = useNuxtApp()
const { dragMeta } = useDrag()

const elRef = shallowRef<HTMLElement | null>(null)

const isOver = computed(() => {
  const isAcceptable = () => {
    if (!props.acceptableKeys) return true

    if (dragMeta.value === null) return false

    if (Array.isArray(props.acceptableKeys))
      return props.acceptableKeys.includes(dragMeta.value?.key)

    return props.acceptableKeys === dragMeta.value?.key
  }

  if (!$dragHandler.isDragging.value || !isAcceptable()) return false

  return checkMatch()
})

watch(isOver, () => {
  if (isOver.value) emits('over')
  else emits('leave')
})

watch($dragHandler.droppedItemPaths, () => {
  if (checkMatch()) emits('drop', $dragHandler.droppedItemPaths.value, dragMeta.value)
})

function checkMatch() {
  const target = $dragHandler.overElement.value
  const container = unrefElement(elRef)

  if (!target || !container) return false

  return container === target || container.contains(target)
}
</script>

<template>
  <div
    ref="elRef"
    :class="cn('contents', props.class)"
    v-bind="$attrs"
    tabindex="-1"
  >
    <RekaSlot :data-drag-over="isOver ? '' : undefined">
      <slot
        :is-over
        :drag-meta
      />
    </RekaSlot>
  </div>
</template>
