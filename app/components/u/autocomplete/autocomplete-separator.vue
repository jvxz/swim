<script setup lang="ts">
import type { ComboboxSeparatorProps } from 'reka-ui'
import { AutocompleteSeparator } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AutocompleteSeparator
    data-slot="autocomplete-separator"
    v-bind="delegatedProps"
    :class="cn('-mx-1 my-1 h-px bg-border', props.class)"
  >
    <slot />
  </AutocompleteSeparator>
</template>
