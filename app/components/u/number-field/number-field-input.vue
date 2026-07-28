<script setup lang="ts">
import { NumberFieldInput } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="
      cn(
        'w-full text-center',
        staticStyles.base,
        interactiveStyles.size.default,
        staticStyles.variant.default,
        props.class,
      )
    "
  />
</template>
