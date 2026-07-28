<script setup lang="ts">
import type { ComboboxAnchorProps } from 'reka-ui'
import { AutocompleteAnchor, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<ComboboxAnchorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteAnchor
    data-slot="autocomplete-anchor"
    v-bind="forwarded"
    :class="
      cn(
        staticStyles.base,
        interactiveStyles.size.default,
        staticStyles.variant.default,
        'flex items-center justify-between pr-0 data-placeholder:text-muted-foreground',
        props.class,
      )
    "
  >
    <slot />
  </AutocompleteAnchor>
</template>
