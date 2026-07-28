<script lang="ts" setup>
defineProps<{
  label: string
  class?: string
}>()

const id = useId()
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('space-y-2', $props.class)"
  >
    <ULabel
      :for="id"
      class="text-sm font-medium"
    >
      {{ label }}
    </ULabel>
    <slot :id />
  </div>
</template>
