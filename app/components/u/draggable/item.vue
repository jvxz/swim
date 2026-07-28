<script lang="ts" setup>
defineProps<{
  class?: string
}>()
</script>

<template>
  <UButton
    v-bind="$attrs"
    variant="ghost"
    :class="
      cn(
        'cursor-move justify-start gap-2 rounded-none transition-none duration-0 active:text-foreground',
        $props.class,
      )
    "
  >
    <Icon
      name="tabler:grip-vertical"
      class="size-3.5!"
    />
    <slot />
  </UButton>
</template>
