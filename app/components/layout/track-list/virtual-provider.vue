<script lang="ts" setup>
const props = defineProps<{
  entries: TrackListEntry[]
}>()

const { containerProps, list, wrapperProps } = useVirtualList(
  computed(() => props.entries),
  {
    itemHeight: TRACK_LIST_ITEM_HEIGHT,
    overscan: 8,
  },
)
const modelY = defineModel<number>('scrollY')
const { y } = useScroll(containerProps.ref, { throttle: 500 })

watch(y, (v) => {
  modelY.value = v ?? 0
})

watch(modelY, (v) => {
  if (v === y.value) return

  y.value = v ?? 0
})
</script>

<template>
  <slot
    :container-props="containerProps"
    :list="list"
    :wrapper-props="wrapperProps"
  />
</template>
