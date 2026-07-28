<script setup lang="ts">
import type { ComboboxCancelProps } from 'reka-ui'
import { AutocompleteCancel, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { cn, interactiveStyles } from '#imports'

const props = withDefaults(
  defineProps<ComboboxCancelProps & { class?: HTMLAttributes['class']; size?: 'sm' | 'default' }>(),
  { size: 'default' },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteCancel
    data-slot="autocomplete-cancel"
    :data-size="size"
    v-bind="forwarded"
    :class="cn(interactiveStyles.base, interactiveStyles.size.icon, props.class)"
  >
    <slot>
      <UButton
        variant="ghost"
        size="icon"
        class="size-5"
      >
        <Icon
          name="mingcute:close-line"
          class="text-muted-foreground size-3.5!"
        />
      </UButton>
    </slot>
  </AutocompleteCancel>
</template>
