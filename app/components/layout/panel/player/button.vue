<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    class?: string
    variant?: 'sub' | 'main'
  }>(),
  {
    variant: 'sub',
  },
)
</script>

<template>
  <button
    v-if="variant === 'sub'"
    :class="
      cn(
        'flex size-8 items-center justify-center active:text-muted-foreground disabled:opacity-40 disabled:active:text-inherit',
        props.class,
      )
    "
  >
    <slot />
  </button>
  <button
    v-else
    class="rounded-full bg-foreground flex size-10 items-center justify-center active:bg-muted-foreground"
  >
    <slot />
  </button>
</template>
