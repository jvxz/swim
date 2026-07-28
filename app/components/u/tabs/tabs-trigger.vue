<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        interactiveStyles.base,
        interactiveStyles.variant.ghost,
        'relative inline-flex size-full flex-1 cursor-default items-center justify-center border-0 bg-transparent text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground',
        props.class,
      )
    "
  >
    <span class="truncate">
      <slot />
    </span>
  </TabsTrigger>
</template>
