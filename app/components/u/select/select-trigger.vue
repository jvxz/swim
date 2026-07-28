<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import type { ButtonProps } from '../button.vue'

const props = withDefaults(
  defineProps<
    SelectTriggerProps & {
      class?: HTMLAttributes['class']
      size?: 'sm' | 'default'
      variant?: ButtonProps['variant']
      withIcon?: boolean
    }
  >(),
  { size: 'default', variant: 'soft', withIcon: true },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(
        interactiveStyles.base,
        interactiveStyles.variant[props.variant],
        interactiveStyles.size[props.size],
        'flex items-center justify-between data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
        withIcon && 'pr-1.5',
        props.class,
      )
    "
  >
    <slot />

    <SelectIcon
      v-if="withIcon"
      as-child
    >
      <Icon
        name="tabler:chevron-down"
        class="size-3.5!"
      />
    </SelectIcon>
  </SelectTrigger>
</template>
