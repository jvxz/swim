<script lang="ts" setup>
const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('flex h-fit w-1/4 flex-col gap-2 p-2', props.class)"
  >
    <slot />
  </div>
</template>
