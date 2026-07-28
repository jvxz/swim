<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<
  ContextMenuItemProps & { class?: HTMLAttributes['class']; inset?: boolean }
>()
const emits = defineEmits<ContextMenuItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuItem
    v-bind="forwarded"
    :class="
      cn(
        popoverStyles.item,
        'has-[svg]:px-1.5 [&_.iconify]:size-4! [&_svg]:text-foreground!',
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>
