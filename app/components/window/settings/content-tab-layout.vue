<script lang="ts" setup>
defineProps<{
  class?: string
  title?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4 w-full justify-self-start">
    <FormTitle
      v-if="title"
      class="text-xl"
    >
      {{ upperFirst(title) }}
    </FormTitle>
    <div
      v-bind="$attrs"
      :class="cn('flex flex-col gap-4', $props.class)"
    >
      <slot />
    </div>
  </div>
</template>
