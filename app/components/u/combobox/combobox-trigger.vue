<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui'
import { ComboboxTrigger, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<
    ComboboxTriggerProps & { class?: HTMLAttributes['class']; size?: 'sm' | 'default' }
  >(),
  { size: 'default' },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxTrigger
    data-slot="combobox-trigger"
    :data-size="size"
    v-bind="forwarded"
    :class="cn(interactiveStyles.base, interactiveStyles.size.icon, props.class)"
  >
    <slot>
      <Icon
        name="tabler:chevron-down"
        class="text-muted-foreground translate-y-0.5 size-3.5!"
      />
    </slot>
  </ComboboxTrigger>
</template>
