<script setup lang="ts">
import type { ComboboxItemIndicatorProps } from 'reka-ui'
import { AutocompleteItemIndicator, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<ComboboxItemIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteItemIndicator
    data-slot="autocomplete-item-indicator"
    v-bind="forwarded"
    :class="cn('ml-auto', props.class)"
  >
    <slot>
      <Icon
        name="mingcute:check-line"
        class="size-3!"
      />
    </slot>
  </AutocompleteItemIndicator>
</template>
