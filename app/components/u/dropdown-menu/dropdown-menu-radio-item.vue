<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem
    v-bind="forwarded"
    :class="cn(popoverStyles.item, props.class)"
  >
    <span class="flex h-full pointer-events-none items-center left-2 justify-center absolute">
      <DropdownMenuItemIndicator>
        <Icon
          name="tabler:circle-filled"
          class="fill-current size-2.5!"
        />
      </DropdownMenuItemIndicator>
    </span>
    <span class="ps-4.5"><slot /></span>
  </DropdownMenuRadioItem>
</template>
