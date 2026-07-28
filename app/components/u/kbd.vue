<script lang="ts" setup>
const props = defineProps<{
  class?: string
  icon?: string
}>()
</script>

<template>
  <kbd
    :class="
      cn(
        'inline-flex size-fit items-center justify-center gap-0.5 rounded-sm bg-muted p-0 px-0.5 font-sans text-xs text-muted-foreground *:text-trim',
        props.class,
      )
    "
  >
    <Icon
      v-if="props.icon"
      :name="props.icon"
    />
    <span v-else>⌘</span>
    <slot />
  </kbd>
</template>
