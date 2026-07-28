<script setup lang="ts">
import type { ComboboxEmptyProps } from 'reka-ui'
import { AutocompleteEmpty } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AutocompleteEmpty
    data-slot="autocomplete-empty"
    v-bind="delegatedProps"
    :class="cn('py-6 text-center text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AutocompleteEmpty>
</template>
