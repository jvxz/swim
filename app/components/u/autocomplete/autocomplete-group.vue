<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui'
import { AutocompleteGroup, AutocompleteLabel } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<
  ComboboxGroupProps & {
    class?: HTMLAttributes['class']
    heading?: string
  }
>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AutocompleteGroup
    data-slot="autocomplete-group"
    v-bind="delegatedProps"
    :class="cn('overflow-hidden text-foreground', props.class)"
  >
    <AutocompleteLabel
      v-if="heading"
      class="text-xs text-muted-foreground font-medium px-2 py-1.5"
    >
      {{ heading }}
    </AutocompleteLabel>
    <slot />
  </AutocompleteGroup>
</template>
