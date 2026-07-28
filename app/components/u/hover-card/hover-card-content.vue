<script setup lang="ts">
import type { HoverCardContentProps } from 'reka-ui'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<HoverCardContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 8,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      v-bind="forwardedProps"
      :class="cn(popoverStyles.content, 'w-64 p-4 text-sm', props.class)"
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
