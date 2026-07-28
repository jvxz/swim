<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { ContextMenuRadioItemEmits, ContextMenuRadioItemProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<ContextMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuRadioItem
    v-bind="forwarded"
    :class="cn(popoverStyles.item, props.class)"
  >
    <span class="flex size-3.5 pointer-events-none items-center left-2 justify-center absolute">
      <ContextMenuItemIndicator>
        <Icon
          name="tabler:circle-fill"
          class="size-2!"
        />
      </ContextMenuItemIndicator>
    </span>
    <slot />
  </ContextMenuRadioItem>
</template>
